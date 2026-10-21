import { median, sampleRivals, type Rival } from "./mock-market";
import type { Place } from "./postcode";
import { itemsFor, SECTORS } from "./sectors";
import { loadTown, type TownData } from "./town-data";
import { launchedTownFor } from "./towns";

export { NOT_A_GYM, type Business } from "./town-data";

/**
 * Which businesses a profile is compared against. Towns we've launched in use
 * real businesses (from the database, else the code files: lib/town-data.ts);
 * everywhere else falls back to the anonymous sample data.
 */
export type Market =
  | { real: false; rivals: Rival[] }
  | { real: true; town: string; fetched: string; attribution: string; rivals: Rival[]; dataFrom: TownData["from"] };

/** Postcodes in a launched town (by outcode, e.g. SL6). */
export function realTownFor(postcode: string) {
  return launchedTownFor(postcode);
}

const MILES_PER_DEG_LAT = 69.05;

/** Distance in miles and map bearing (0 = east, clockwise, like screen coords). */
function offset(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const north = (to.lat - from.lat) * MILES_PER_DEG_LAT;
  const east = (to.lng - from.lng) * MILES_PER_DEG_LAT * Math.cos((from.lat * Math.PI) / 180);
  return { miles: Math.hypot(north, east), bearing: (Math.atan2(-north, east) * 180) / Math.PI };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A short label for map pins: the name, trimmed to its first words if long. */
function shortName(name: string) {
  if (name.length <= 18) return name;
  const words = name.split(/\s+/);
  let out = words[0];
  for (const w of words.slice(1)) {
    if ((out + " " + w).length > 18) break;
    out += " " + w;
  }
  return out;
}

export async function marketFor(sector: string, postcode: string, place: Place | null): Promise<Market> {
  const launched = realTownFor(postcode);
  const town = launched && place ? await loadTown(launched.name) : null;
  if (!town || !place) return { real: false, rivals: sampleRivals(sector, itemsFor(sector).map((i) => i.id)) };
  return { real: true, town: town.name, fetched: town.fetched, attribution: town.attribution, rivals: realRivals(town, sector, place), dataFrom: town.from };
}

/** A launched town's real businesses in one sector, with distance and bearing from `place`. */
function realRivals(town: TownData, sector: string, place: { lat: number; lng: number }): Rival[] {
  return town.businesses
    .filter((b) => b.sector === sector && b.comparable)
    .map((b): Rival => {
      const { miles, bearing } = offset(place, b);
      const price = town.prices[b.osm];
      const name = b.displayName ?? price?.name ?? b.name;
      return {
        id: `${slug(name)}-${b.osm.replace("/", "-")}`,
        name,
        short: shortName(name),
        miles: Math.round(miles * 10) / 10,
        bearing,
        lat: b.lat,
        lng: b.lng,
        segment: b.address?.split(",")[0] ?? "",
        prices: price?.prices ?? {},
        firstSeen: (price?.checked ?? town.fetched).slice(0, 7),
        source: "public website",
        checked: price?.checked ?? town.fetched,
        real: { address: b.address, website: b.website, priceUrl: price?.url, priceNote: price?.note, caveat: price?.caveat, fromOsm: !b.osm.startsWith("extra/"), researched: !!price, businessId: b.osm },
      };
    })
    .filter((r) => r.miles <= 10)
    // Nearest first; equal distances alphabetically, so the order doesn't depend on where the data came from.
    .sort((a, b) => a.miles - b.miles || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

/**
 * How many businesses publish their prices online, per sector, within `miles`
 * of a launched town's centre. A sector only appears once every business in
 * range has been checked, so the figures are never based on partial research.
 * "Price on request" counts as not publishing.
 */
export async function publishingStats(townName = "Maidenhead", miles = 3) {
  const town = await loadTown(townName);
  if (!town) return null;
  const sectors = SECTORS.flatMap((s) => {
    const nearby = realRivals(town, s.label, town.centre).filter((r) => r.miles <= miles);
    if (!nearby.length || nearby.some((r) => !r.real?.researched)) return [];
    return [{ sector: s.label, plural: s.plural, total: nearby.length, published: nearby.filter(hasPrices).length }];
  });
  const dates = Object.values(town.prices).map((p) => p.checked).sort();
  return { town: town.name, miles, checked: dates.at(-1) ?? town.fetched, sectors };
}

export const hasPrices = (r: Rival) => Object.keys(r.prices).length > 0;

export type TourStop = {
  id: string;
  name: string;
  sector: string;
  lat: number;
  lng: number;
  address?: string;
  prices: { label: string; per: string; price: number; median: number | null }[];
  /** Where the prices were read, e.g. "treatwell.co.uk". */
  source: string | null;
  checked: string;
};

/**
 * The home page map tour: businesses near a launched town's centre that publish prices,
 * across sectors (taking turns, so the tour doesn't show five gyms in a row), with each
 * price's area median. Also the other businesses' positions, drawn as plain dots.
 */
export async function homeTour(townName = "Maidenhead", miles = 3) {
  const town = await loadTown(townName);
  if (!town) return null;
  const bySector = SECTORS.map((s) => {
    const nearby = realRivals(town, s.label, town.centre).filter((r) => r.miles <= miles);
    const priced = nearby.filter(hasPrices);
    const items = itemsFor(s.label);
    const medians = Object.fromEntries(
      items.map((i) => {
        const values = priced.map((r) => r.prices[i.id]).filter((v): v is number => v != null);
        return [i.id, values.length >= 3 ? median(values) : null];
      }),
    );
    return {
      nearby,
      stops: priced.map((r): TourStop => {
        let source: string | null = null;
        try {
          source = r.real?.priceUrl ? new URL(r.real.priceUrl).hostname.replace(/^www\./, "") : null;
        } catch {}
        return {
          id: r.id,
          name: r.name,
          sector: s.label,
          lat: r.lat!,
          lng: r.lng!,
          address: r.real?.address,
          prices: items.filter((i) => r.prices[i.id] != null).map((i) => ({ label: i.label, per: i.per, price: r.prices[i.id], median: medians[i.id] })),
          source,
          checked: r.checked,
        };
      }),
    };
  });
  const stops: TourStop[] = [];
  for (let i = 0; bySector.some((s) => i < s.stops.length); i++) for (const s of bySector) if (s.stops[i]) stops.push(s.stops[i]);
  const tourIds = new Set(stops.map((s) => s.id));
  const dots = bySector.flatMap((s) => s.nearby.filter((r) => !tourIds.has(r.id)).map((r) => [r.lng!, r.lat!] as [number, number]));
  return { town: town.name, centre: town.centre, miles, stops, dots };
}
