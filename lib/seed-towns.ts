import "server-only";
import berkshire from "./data/berkshire-businesses.json";
import maidenhead from "./data/maidenhead-businesses.json";
import { MAIDENHEAD_EXTRA, MAIDENHEAD_NOT_COMPARABLE, MAIDENHEAD_PRICES, MAIDENHEAD_SECTOR_FIXES } from "./data/maidenhead-prices";
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

  const known = new Set(businesses.map((b) => b.id));
  const checks = Object.entries(MAIDENHEAD_PRICES).map(([id, rec]) => {
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
      method: rec.url ? (/booksy\.com|fresha\.com/.test(rec.url) ? "booking_page" : "website") : null,
      caveat: rec.caveat ?? null,
    };
  });

  const observations = Object.entries(MAIDENHEAD_PRICES).flatMap(([id, rec]) =>
    Object.entries(rec.prices).map(([item_id, price]) => ({ check_id: `${id}@${rec.checked}`, item_id, price })),
  );

  return { businesses, checks, observations };
}

/**
 * Rows for the rest of Berkshire: every business in the county snapshot that
 * isn't already in Maidenhead's (those keep their town, fixes and research).
 * No prices yet. Upserting is safe to repeat.
 */
export function berkshireSeed() {
  const known = new Set([...(maidenhead.businesses as Business[]), ...MAIDENHEAD_EXTRA].map((b) => b.osm));
  const businesses = (berkshire.businesses as Business[])
    .filter((b) => !known.has(b.osm))
    .map((b) => ({
      id: b.osm,
      town: "Berkshire",
      name: b.name,
      display_name: null,
      sector: b.sector,
      comparable: !(b.sector === "Gym" && NOT_A_GYM.test(b.name)),
      lat: b.lat,
      lng: b.lng,
      address: b.address ?? null,
      website: b.website ?? null,
      source: "openstreetmap",
      listed_on: berkshire.fetched,
    }));
  return { businesses };
}
