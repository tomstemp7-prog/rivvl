import maidenhead from "./data/maidenhead-businesses.json";
import { MAIDENHEAD_EXTRA, MAIDENHEAD_PRICES } from "./data/maidenhead-prices";
import { RIVALS, type Rival } from "./mock-market";
import type { Place } from "./postcode";

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
    outcodes: ["SL6"],
    fetched: maidenhead.fetched,
    attribution: maidenhead.attribution,
    businesses: [...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA],
    prices: MAIDENHEAD_PRICES,
  },
];

/** Postcodes in a launched town (by outcode, e.g. SL6). */
export function realTownFor(postcode: string) {
  const outcode = postcode.trim().toUpperCase().split(/\s+/)[0];
  return TOWNS.find((t) => t.outcodes.includes(outcode)) ?? null;
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
  if (!town || !place) return { real: false, rivals: RIVALS };

  const rivals = town.businesses
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
        segment: b.address?.split(",")[0] ?? "",
        prices: price?.prices ?? {},
        firstSeen: (price?.checked ?? town.fetched).slice(0, 7),
        source: "public website",
        checked: price?.checked ?? town.fetched,
        real: { address: b.address, website: b.website, priceUrl: price?.url, priceNote: price?.note, caveat: price?.caveat },
      };
    })
    .filter((r) => r.miles <= 10)
    .sort((a, b) => a.miles - b.miles);

  return { real: true, town: town.name, fetched: town.fetched, attribution: town.attribution, rivals };
}

export const hasPrices = (r: Rival) => Object.keys(r.prices).length > 0;
