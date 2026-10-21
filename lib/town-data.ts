import "server-only";
import { unstable_cache } from "next/cache";
import maidenhead from "./data/maidenhead-businesses.json";
import { MAIDENHEAD_EXTRA, MAIDENHEAD_NOT_COMPARABLE, MAIDENHEAD_PRICES, MAIDENHEAD_SECTOR_FIXES, type PriceRecord } from "./data/maidenhead-prices";
import { db } from "./db";

/**
 * A launched town's real businesses and researched prices. The database
 * (tables businesses, price_checks, price_observations) is the source of
 * truth; the code files in lib/data are the fallback when it isn't
 * configured (local dev: the keys are Vercel "Sensitive") or can't be read.
 */

export type Business = {
  osm: string;
  name: string;
  sector: string;
  lat: number;
  lng: number;
  address?: string;
  website?: string;
};

/** A business as the site uses it: sector fixes applied, and whether it's a comparable business. */
export type TownBusiness = Business & {
  /** False for things OSM files as a gym that aren't comparable (gymnastics clubs, school halls). */
  comparable: boolean;
  /** Clearer name where the source's is ambiguous, e.g. "PureGym Maidenhead". */
  displayName?: string;
};

export type TownData = {
  name: string;
  centre: { lat: number; lng: number };
  /** How far from the centre the business list reaches; beyond it, counts are incomplete. */
  coverageMiles: number;
  /** When the business list was taken from its source. */
  fetched: string;
  attribution: string;
  businesses: TownBusiness[];
  /** Latest research per business id (OSM id or "extra/…"). */
  prices: Record<string, PriceRecord>;
  from: "database" | "files";
};

/** OSM "gyms" that aren't comparable gyms: gymnastics, tennis, school halls, unnamed rooms. */
export const NOT_A_GYM = /gymnastic|tennis|activity centre|sports club|little gym|sports hall|university|^(old |new )?gym$|^gymnasium$|^fitness room$/i;

/** What a check found, as the note shown in place of a price. */
const NOTES: Record<string, string | undefined> = {
  published: undefined,
  price_on_request: "Price on request",
  members_only: "Members only",
  not_published: "Not published online",
};

/** Town details the database doesn't hold (map centre, data credit). */
const TOWN_META = {
  Maidenhead: { centre: { lat: maidenhead.town.lat, lng: maidenhead.town.lng }, coverageMiles: maidenhead.radiusMiles, attribution: maidenhead.attribution },
};

/** The town as the code files describe it: the fallback, and the source the database was seeded from. */
function fromFiles(name: string): TownData | null {
  if (name !== "Maidenhead") return null;
  const businesses = [...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA].map((b): TownBusiness => {
    const sector = MAIDENHEAD_SECTOR_FIXES[b.osm] ?? b.sector;
    const comparable = !(sector === "Gym" && NOT_A_GYM.test(b.name)) && !MAIDENHEAD_NOT_COMPARABLE[b.osm];
    return { ...b, sector, comparable, displayName: MAIDENHEAD_PRICES[b.osm]?.name };
  });
  return { name, ...TOWN_META.Maidenhead, fetched: maidenhead.fetched, businesses, prices: MAIDENHEAD_PRICES, from: "files" };
}

const PAGE = 1000;

async function fromDatabase(name: string): Promise<TownData | null> {
  const client = db();
  const meta = TOWN_META[name as keyof typeof TOWN_META];
  if (!client || !meta) return null;

  type Row = {
    id: string;
    name: string;
    display_name: string | null;
    sector: string;
    comparable: boolean;
    lat: number;
    lng: number;
    address: string | null;
    website: string | null;
    listed_on: string;
  };
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("businesses")
      .select("id, name, display_name, sector, comparable, lat, lng, address, website, listed_on")
      .eq("town", name)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`businesses: ${error.message}`);
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }
  if (!rows.length) return null;

  type Check = {
    business_id: string;
    checked_on: string;
    outcome: string;
    source_url: string | null;
    caveat: string | null;
    price_observations: { item_id: string; price: number | string }[];
  };
  const checks: Check[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("price_checks")
      .select("business_id, checked_on, outcome, source_url, caveat, price_observations(item_id, price), businesses!inner(town)")
      .eq("businesses.town", name)
      .order("checked_on", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`price_checks: ${error.message}`);
    checks.push(...(data as unknown as Check[]));
    if (data.length < PAGE) break;
  }

  const displayNames = new Map(rows.map((r) => [r.id, r.display_name ?? undefined]));
  const prices: Record<string, PriceRecord> = {};
  // Newest first, so the first check seen for a business is its latest.
  for (const c of checks) {
    if (prices[c.business_id]) continue;
    prices[c.business_id] = {
      prices: Object.fromEntries(c.price_observations.map((o) => [o.item_id, Number(o.price)])),
      url: c.source_url ?? undefined,
      checked: c.checked_on,
      note: NOTES[c.outcome],
      caveat: c.caveat ?? undefined,
      name: displayNames.get(c.business_id),
    };
  }

  return {
    name,
    ...meta,
    fetched: rows.map((r) => r.listed_on).sort().at(-1)!,
    businesses: rows.map((r) => ({
      osm: r.id,
      name: r.name,
      sector: r.sector,
      lat: r.lat,
      lng: r.lng,
      address: r.address ?? undefined,
      website: r.website ?? undefined,
      comparable: r.comparable,
      displayName: r.display_name ?? undefined,
    })),
    prices,
    from: "database",
  };
}

/** Database reads are cached for five minutes, so dashboard pages stay fast and edits show up soon after. */
const cachedFromDatabase = unstable_cache(fromDatabase, ["town-data"], { revalidate: 300, tags: ["town-data"] });

/** A launched town's businesses and prices: the database when it's available, else the code files. */
export async function loadTown(name: string): Promise<TownData | null> {
  if (db()) {
    try {
      const town = await cachedFromDatabase(name);
      // Town details come from the code, not the cache, so a change to them shows at once.
      if (town) return { ...town, ...TOWN_META[name as keyof typeof TOWN_META] };
    } catch (e) {
      console.error(`Town data for ${name} unavailable from the database; using the code files.`, e);
    }
  }
  return fromFiles(name);
}
