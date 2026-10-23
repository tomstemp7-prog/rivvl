import "server-only";
import { unstable_cache } from "next/cache";
import berkshire from "./data/berkshire-businesses.json";
import berkshireOutline from "./data/berkshire-outline.json";
import maidenhead from "./data/maidenhead-businesses.json";
import { MAIDENHEAD_EXTRA, MAIDENHEAD_NOT_COMPARABLE, MAIDENHEAD_PRICES, MAIDENHEAD_SECTOR_FIXES, type PriceRecord } from "./data/maidenhead-prices";
import { db } from "./db";

/**
 * A region's real businesses and researched prices (Berkshire: the whole
 * county, plus 10 miles around Maidenhead, where prices are researched). The
 * database (tables businesses, price_checks, price_observations) is the
 * source of truth; the code files in lib/data are the fallback when it isn't
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

type Point = { lat: number; lng: number };

export type TownData = {
  name: string;
  /** The town with researched prices, and its centre: the home page tour and publishing stats are about it. */
  focus: { name: string; centre: Point };
  /** Where the business list is complete: inside these circles or the outline. Beyond, counts are incomplete. */
  coverage: { circles: (Point & { miles: number })[]; rings: number[][][] };
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

const MAIDENHEAD = { lat: maidenhead.town.lat, lng: maidenhead.town.lng };

/** Region details the database doesn't hold: its rows' town labels, focus town, coverage and data credit. */
const REGION_META = {
  Berkshire: {
    towns: ["Maidenhead", "Berkshire"],
    focus: { name: "Maidenhead", centre: MAIDENHEAD },
    coverage: { circles: [{ ...MAIDENHEAD, miles: maidenhead.radiusMiles }], rings: berkshireOutline.rings },
    attribution: maidenhead.attribution,
  },
};

/** A region's details for TownData, without the database's town labels. */
function details(name: string) {
  const meta = REGION_META[name as keyof typeof REGION_META];
  if (!meta) return null;
  const { towns: _towns, ...rest } = meta;
  return rest;
}

const comparableFor = (b: Business, sector: string) => !(sector === "Gym" && NOT_A_GYM.test(b.name)) && !MAIDENHEAD_NOT_COMPARABLE[b.osm];

/** The region as the code files describe it: the fallback, and the source the database was seeded from. */
function fromFiles(name: string): TownData | null {
  if (name !== "Berkshire") return null;
  const seen = new Set<string>();
  const all = [...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA, ...(berkshire.businesses as Business[])].filter((b) => {
    if (seen.has(b.osm)) return false;
    seen.add(b.osm);
    return true;
  });
  const businesses = all.map((b): TownBusiness => {
    const sector = MAIDENHEAD_SECTOR_FIXES[b.osm] ?? b.sector;
    return { ...b, sector, comparable: comparableFor(b, sector), displayName: MAIDENHEAD_PRICES[b.osm]?.name };
  });
  const fetched = [maidenhead.fetched, berkshire.fetched].sort().at(-1)!;
  return { name, ...details(name)!, fetched, businesses, prices: MAIDENHEAD_PRICES, from: "files" };
}

/** Whether a circle of `miles` around `point` lies wholly inside the region's coverage (checked at 48 points on its edge). */
export function circleCovered(area: TownData, point: Point, miles: number) {
  const inside = (p: Point) =>
    area.coverage.circles.some((c) => milesBetween(c, p) <= c.miles + 0.01) || area.coverage.rings.some((r) => inRing(r, p));
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * 2 * Math.PI;
    const p = {
      lat: point.lat + (Math.sin(a) * miles) / MILES_PER_DEG,
      lng: point.lng + (Math.cos(a) * miles) / (MILES_PER_DEG * Math.cos((point.lat * Math.PI) / 180)),
    };
    if (!inside(p)) return false;
  }
  return true;
}

const MILES_PER_DEG = 69.05;

function milesBetween(a: Point, b: Point) {
  return Math.hypot((b.lat - a.lat) * MILES_PER_DEG, (b.lng - a.lng) * MILES_PER_DEG * Math.cos((a.lat * Math.PI) / 180));
}

/** Ray casting; a ring is [lng, lat] pairs. */
function inRing(ring: number[][], { lat, lng }: Point) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const PAGE = 1000;

async function fromDatabase(name: string): Promise<TownData | null> {
  const client = db();
  const meta = REGION_META[name as keyof typeof REGION_META];
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
      .in("town", meta.towns)
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
      .in("businesses.town", meta.towns)
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
    ...details(name)!,
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

/** A region's businesses and prices: the database when it's available, else the code files. */
export async function loadTown(name: string): Promise<TownData | null> {
  if (db()) {
    try {
      const town = await cachedFromDatabase(name);
      // Region details come from the code, not the cache, so a change to them shows at once.
      if (town) return { ...town, ...details(name)! };
    } catch (e) {
      console.error(`Town data for ${name} unavailable from the database; using the code files.`, e);
    }
  }
  return fromFiles(name);
}
