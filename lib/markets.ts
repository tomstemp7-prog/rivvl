import maidenhead from "./data/maidenhead-businesses.json";
import { MAIDENHEAD_EXTRA, MAIDENHEAD_PRICES, MAIDENHEAD_SECTOR_FIXES } from "./data/maidenhead-prices";
import { sampleRivals, type Rival } from "./mock-market";
import type { Place } from "./postcode";
import { itemsFor, SECTORS } from "./sectors";
import { launchedTownFor } from "./towns";

/**
 * Which businesses a profile is compared against. Towns we've launched in use
 * real businesses (OpenStreetMap snapshot plus researched prices); everywhere
 * else falls back to the anonymous sample data.
 */
export type Market =
  | { real: false; rivals: Rival[] }
  | { real: true; town: string; fetched: string; attribution: string; rivals: Rival[] };

export type Business = {
  osm: string;
  name: string;
  sector: string;
  lat: number;
  lng: number;
  address?: string;
  website?: string;
};

const TOWNS = [
  {
    name: "Maidenhead",
    centre: { lat: maidenhead.town.lat, lng: maidenhead.town.lng },
    fetched: maidenhead.fetched,
    attribution: maidenhead.attribution,
    businesses: [...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA].map((b) => ({
      ...b,
      sector: MAIDENHEAD_SECTOR_FIXES[b.osm] ?? b.sector,
    })),
    prices: MAIDENHEAD_PRICES,
  },
];

/** Postcodes in a launched town (by outcode, e.g. SL6). */
export function realTownFor(postcode: string) {
  const launched = launchedTownFor(postcode);
  return launched ? (TOWNS.find((t) => t.name === launched.name) ?? null) : null;
}

/** OSM "gyms" that aren't comparable gyms: gymnastics, tennis, school halls, unnamed rooms. */
const NOT_A_GYM = /gymnastic|tennis|activity centre|sports club|little gym|sports hall|university|^(old |new )?gym$|^gymnasium$|^fitness room$/i;

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

export function marketFor(sector: string, postcode: string, place: Place | null): Market {
  const town = realTownFor(postcode);
  if (!town || !place) return { real: false, rivals: sampleRivals(sector, itemsFor(sector).map((i) => i.id)) };
  return { real: true, town: town.name, fetched: town.fetched, attribution: town.attribution, rivals: realRivals(town, sector, place) };
}

/** A launched town's real businesses in one sector, with distance and bearing from `place`. */
function realRivals(town: (typeof TOWNS)[number], sector: string, place: { lat: number; lng: number }): Rival[] {
  return town.businesses
    .filter((b) => b.sector === sector && !(sector === "Gym" && NOT_A_GYM.test(b.name)))
    .map((b): Rival => {
      const { miles, bearing } = offset(place, b);
      const price = town.prices[b.osm];
      const name = price?.name ?? b.name;
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
        real: { address: b.address, website: b.website, priceUrl: price?.url, priceNote: price?.note, caveat: price?.caveat, fromOsm: !b.osm.startsWith("extra/"), researched: !!price },
      };
    })
    .filter((r) => r.miles <= 10)
    .sort((a, b) => a.miles - b.miles);
}

/**
 * How many businesses publish their prices online, per sector, within `miles`
 * of a launched town's centre. A sector only appears once every business in
 * range has been checked, so the figures are never based on partial research.
 * "Price on request" counts as not publishing.
 */
export function publishingStats(townName = "Maidenhead", miles = 3) {
  const town = TOWNS.find((t) => t.name === townName);
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
