import "server-only";
import berkshire from "./data/berkshire-businesses.json";
import maidenhead from "./data/maidenhead-businesses.json";
import { BERKSHIRE_NOT_COMPARABLE, BERKSHIRE_PRICES } from "./data/berkshire-prices";
import { MAIDENHEAD_EXTRA, MAIDENHEAD_NOT_COMPARABLE, MAIDENHEAD_PRICES, MAIDENHEAD_SECTOR_FIXES, type PriceRecord } from "./data/maidenhead-prices";
import { NOT_A_GYM, type Business } from "./markets";

/**
 * Rows for the businesses / price_checks / price_observations tables
 * (supabase/migrations/0002_businesses.sql), built from the same research
 * files the site reads, so the database matches the site exactly.
 */
export function maidenheadSeed() {
  const town = maidenhead.town.name;
  const listed = maidenhead.fetched;

  const businesses = [...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA].map((b) => {
    const sector = MAIDENHEAD_SECTOR_FIXES[b.osm] ?? b.sector;
    return {
      id: b.osm,
      town,
      name: b.name,
      display_name: MAIDENHEAD_PRICES[b.osm]?.name ?? null,
      sector,
      comparable: !(sector === "Gym" && NOT_A_GYM.test(b.name)) && !MAIDENHEAD_NOT_COMPARABLE[b.osm],
      lat: b.lat,
      lng: b.lng,
      address: b.address ?? null,
      website: b.website ?? null,
      source: b.osm.startsWith("extra/") ? "manual" : "openstreetmap",
      listed_on: listed,
    };
  });

  const { checks, observations } = researchRows(MAIDENHEAD_PRICES, new Set(businesses.map((b) => b.id)));
  return { businesses, checks, observations };
}

/** price_checks and price_observations rows for researched prices; every record must name a known business. */
function researchRows(prices: Record<string, PriceRecord>, known: Set<string>) {
  const checks = Object.entries(prices).map(([id, rec]) => {
    if (!known.has(id)) throw new Error(`Price record for unknown business ${id}`);
    const published = Object.keys(rec.prices).length > 0;
    return {
      id: `${id}@${rec.checked}`,
      business_id: id,
      checked_on: rec.checked,
      outcome: published
        ? "published"
        : rec.note === "Price on request"
          ? "price_on_request"
          : rec.note === "Members only"
            ? "members_only"
            : "not_published",
      source_url: rec.url ?? null,
      // A business's own booking page (Booksy, Fresha, Treatwell, Virtuagym) counts as its own published prices.
      method: rec.url ? (/booksy\.com|fresha\.com|treatwell\.co\.uk|virtuagym\.com/.test(rec.url) ? "booking_page" : "website") : null,
      caveat: rec.caveat ?? null,
    };
  });
  const observations = Object.entries(prices).flatMap(([id, rec]) =>
    Object.entries(rec.prices).map(([item_id, price]) => ({ check_id: `${id}@${rec.checked}`, item_id, price })),
  );
  return { checks, observations };
}

/**
 * Rows for the rest of Berkshire: every business in the county snapshot that
 * isn't already in Maidenhead's (those keep their town, fixes and research).
 * Upserting is safe to repeat.
 */
export function berkshireSeed() {
  const known = new Set([...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA].map((b) => b.osm));
  const businesses = (berkshire.businesses as Business[])
    .filter((b) => !known.has(b.osm))
    .map((b) => ({
      id: b.osm,
      town: "Berkshire",
      name: b.name,
      display_name: BERKSHIRE_PRICES[b.osm]?.name ?? null,
      sector: b.sector,
      comparable: !(b.sector === "Gym" && NOT_A_GYM.test(b.name)) && !BERKSHIRE_NOT_COMPARABLE[b.osm],
      lat: b.lat,
      lng: b.lng,
      address: b.address ?? null,
      website: b.website ?? null,
      source: "openstreetmap",
      listed_on: berkshire.fetched,
    }));
  return { businesses };
}

/**
 * The Berkshire research (lib/data/berkshire-prices.ts) as database changes:
 * checks and prices to upsert, plus display names and "not comparable" flags
 * for businesses, some of which are rows of Maidenhead's list.
 */
export function berkshireResearchSeed() {
  const known = new Set([...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA, ...(berkshire.businesses as Business[])].map((b) => b.osm));
  const { checks, observations } = researchRows(BERKSHIRE_PRICES, known);
  const displayNames = Object.entries(BERKSHIRE_PRICES).flatMap(([id, rec]) => (rec.name ? [{ id, display_name: rec.name }] : []));
  const notComparable = Object.keys(BERKSHIRE_NOT_COMPARABLE).filter((id) => {
    if (!known.has(id)) throw new Error(`Not-comparable entry for unknown business ${id}`);
    return true;
  });
  return { checks, observations, displayNames, notComparable };
}
