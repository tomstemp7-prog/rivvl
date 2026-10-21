import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "./auth";
import { db } from "./db";
import { placeFor, type Place } from "./postcode";
import { profileOrDemo, type Profile } from "./profile";
import { radiusMiles } from "./mock-market";
import { RADII } from "./sectors";
import { outcodeOf } from "./towns";

/**
 * Owner-shared prices only feed an area average once at least this many have
 * been shared for that item nearby, so no single owner's price can be worked
 * out from the average.
 */
export const MIN_SHARED_PRICES = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = Record<string, string | string[] | undefined>;

/**
 * The profile for a dashboard page: a saved site (`?site=<id>`), else the
 * signed-in owner's own business, else details in the URL, else the demo.
 * A business with an owner can only be opened by that owner.
 */
export async function resolveProfile(params: Params): Promise<Profile> {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const site = first(params.site);
  const user = await currentUser();
  if (site && UUID.test(site)) {
    const saved = await loadSite(site);
    if (saved) {
      if (saved.ownerId && saved.ownerId !== user?.id) redirect(`/login?next=${encodeURIComponent(`/dashboard?site=${site}`)}`);
      return { ...saved.profile, owned: !!user && saved.ownerId === user.id };
    }
  }
  if (user && !first(params.name)) {
    const mine = await ownedSiteId(user.id);
    const saved = mine ? await loadSite(mine) : null;
    if (saved) return { ...saved.profile, owned: true };
  }
  return profileOrDemo(params);
}

/** The signed-in owner's most recent business, if any. */
export async function ownedSiteId(userId: string) {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("sites").select("id").eq("owner_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function loadSite(id: string): Promise<{ profile: Profile; ownerId: string | null } | null> {
  const client = db();
  if (!client) return null;
  const { data: site } = await client.from("sites").select("id, business_name, sector, postcode, radius, shared, owner_id").eq("id", id).maybeSingle();
  if (!site) return null;
  const { data: prices } = await client.from("shared_prices").select("item_id, price").eq("site_id", id);
  return { ownerId: site.owner_id, profile: {
    id: site.id,
    name: site.business_name,
    sector: site.sector,
    postcode: site.postcode,
    radius: site.radius,
    shared: site.shared,
    prices: Object.fromEntries((prices ?? []).map((p) => [p.item_id, Number(p.price)])),
  } };
}

export type NewSite = {
  name: string;
  email: string;
  sector: string;
  postcode: string;
  radius: string;
  prices: Record<string, number>;
  extras: { label: string; price: number }[];
};

/** Saves a completed sign-up and its shared prices. Returns the new site id, or null if there's no database. */
export async function saveSite(input: NewSite): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const place = await placeFor(input.postcode);
  const outcode = outcodeOf(input.postcode);
  const { data: site, error } = await client
    .from("sites")
    .insert({
      business_name: input.name,
      contact_email: input.email,
      sector: input.sector,
      postcode: place?.postcode ?? input.postcode,
      outcode,
      radius: input.radius,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      shared: true,
      extra_items: input.extras,
      // Signed in while signing up: the business is theirs straight away.
      owner_id: (await currentUser())?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !site) throw new Error(`Couldn't save sign-up: ${error?.message}`);
  const rows = Object.entries(input.prices).map(([item_id, price]) => ({
    site_id: site.id,
    sector: input.sector,
    item_id,
    price,
    outcode,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    source: "signup",
  }));
  if (rows.length) {
    const { error: priceError } = await client.from("shared_prices").insert(rows);
    if (priceError) throw new Error(`Couldn't save prices: ${priceError.message}`);
  }
  return site.id;
}

export type NewInterest = {
  business: string;
  name: string | null;
  email: string;
  phone: string | null;
  sector: string;
  postcode: string | null;
  town: string | null;
  source: string;
  price: { itemId: string; value: number } | null;
};

export async function saveInterest(input: NewInterest) {
  const client = db();
  if (!client) return false;
  const { data: row, error } = await client
    .from("interest")
    .insert({
      business_name: input.business,
      contact_name: input.name,
      email: input.email,
      phone: input.phone,
      sector: input.sector,
      postcode: input.postcode,
      town: input.town,
      source: input.source,
    })
    .select("id")
    .single();
  if (error || !row) throw new Error(`Couldn't save interest: ${error?.message}`);
  if (input.price) {
    const place = input.postcode ? await placeFor(input.postcode) : null;
    const { error: priceError } = await client.from("shared_prices").insert({
      interest_id: row.id,
      sector: input.sector,
      item_id: input.price.itemId,
      price: input.price.value,
      outcode: input.postcode ? outcodeOf(input.postcode) : "",
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      source: "interest",
    });
    if (priceError) throw new Error(`Couldn't save price: ${priceError.message}`);
  }
  return true;
}

/**
 * Owner-shared prices near a place, per radius and item, for pooling into area
 * averages. Only anonymous price lists leave this function: no locations, no
 * businesses. Items with fewer than MIN_SHARED_PRICES within a radius are left
 * out. The viewer's own shared prices are excluded (they're counted as "you").
 */
export async function pooledPrices(sector: string, place: Place | null, excludeSiteId?: string): Promise<Pooled> {
  const client = db();
  const pooled: Pooled = {};
  if (!client || !place) return pooled;
  const { data } = await client
    .from("shared_prices")
    .select("item_id, price, lat, lng, site_id")
    .eq("sector", sector)
    .not("lat", "is", null);
  const near = (data ?? [])
    .filter((row) => !excludeSiteId || row.site_id !== excludeSiteId)
    .map((row) => {
      const north = (row.lat - place.lat) * 69.05;
      const east = (row.lng - place.lng) * 69.05 * Math.cos((place.lat * Math.PI) / 180);
      return { item: row.item_id as string, price: Number(row.price), miles: Math.hypot(north, east) };
    });
  for (const radius of RADII) {
    const byItem: Record<string, number[]> = {};
    for (const row of near) if (row.miles <= radiusMiles(radius)) (byItem[row.item] ??= []).push(row.price);
    for (const [item, values] of Object.entries(byItem)) {
      if (values.length >= MIN_SHARED_PRICES) (pooled[radius] ??= {})[item] = values.sort((a, b) => a - b);
    }
  }
  return pooled;
}

/** radius → item id → anonymous shared prices (only where there are enough to pool). */
export type Pooled = Record<string, Record<string, number[]>>;

export type NewMessage = {
  kind: "contact" | "feedback" | "correction";
  page: string | null;
  siteId: string | null;
  businessId: string | null;
  itemId: string | null;
  suggestedPrice: number | null;
  useful: boolean | null;
  name: string | null;
  email: string | null;
  body: string | null;
};

/** Saves a contact message, page feedback or price correction. Returns false if there's no database. */
export async function saveMessage(m: NewMessage) {
  const client = db();
  if (!client) return false;
  const { error } = await client.from("messages").insert({
    kind: m.kind,
    page: m.page,
    site_id: m.siteId,
    business_id: m.businessId,
    item_id: m.itemId,
    suggested_price: m.suggestedPrice,
    useful: m.useful,
    name: m.name,
    email: m.email,
    body: m.body,
  });
  if (error) throw new Error(`Couldn't save message: ${error.message}`);
  return true;
}

/** Replaces an owner's shared prices and radius. Callers must have checked ownership. */
export async function updateSitePrices(siteId: string, input: { sector: string; radius: string; prices: Record<string, number> }) {
  const client = db();
  if (!client) throw new Error("No database");
  const { data: site, error } = await client.from("sites").update({ radius: input.radius }).eq("id", siteId).select("outcode, lat, lng").single();
  if (error || !site) throw new Error(`Couldn't update site: ${error?.message}`);
  const { error: delError } = await client.from("shared_prices").delete().eq("site_id", siteId).eq("source", "signup");
  if (delError) throw new Error(`Couldn't replace prices: ${delError.message}`);
  const rows = Object.entries(input.prices).map(([item_id, price]) => ({
    site_id: siteId,
    sector: input.sector,
    item_id,
    price,
    outcode: site.outcode,
    lat: site.lat,
    lng: site.lng,
    source: "signup",
  }));
  if (rows.length) {
    const { error: insError } = await client.from("shared_prices").insert(rows);
    if (insError) throw new Error(`Couldn't save prices: ${insError.message}`);
  }
}
