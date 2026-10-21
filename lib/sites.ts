import "server-only";
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

/** The profile for a dashboard page: a saved site (`?site=<id>`), else URL details, else the demo. */
export async function resolveProfile(params: Params): Promise<Profile> {
  const site = Array.isArray(params.site) ? params.site[0] : params.site;
  if (site && UUID.test(site)) {
    const saved = await loadSite(site);
    if (saved) return saved;
  }
  return profileOrDemo(params);
}

async function loadSite(id: string): Promise<Profile | null> {
  const client = db();
  if (!client) return null;
  const { data: site } = await client.from("sites").select("id, business_name, sector, postcode, radius, shared").eq("id", id).maybeSingle();
  if (!site) return null;
  const { data: prices } = await client.from("shared_prices").select("item_id, price").eq("site_id", id);
  return {
    id: site.id,
    name: site.business_name,
    sector: site.sector,
    postcode: site.postcode,
    radius: site.radius,
    shared: site.shared,
    prices: Object.fromEntries((prices ?? []).map((p) => [p.item_id, Number(p.price)])),
  };
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
