/**
 * UK postcode lookups via postcodes.io (free, no key, built on the ONS
 * Postcode Directory). Works from both server and browser.
 */
export type Place = {
  postcode: string;
  lat: number;
  lng: number;
  /** Local authority, e.g. "Reading". */
  district: string;
  ward: string;
  region: string;
};

export type Lookup = { status: "found"; place: Place } | { status: "invalid" } | { status: "unavailable" };

/** Loose shape check before we bother the API. */
export const POSTCODE_SHAPE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/** "rg13eu" → "RG1 3EU". */
export function normalisePostcode(raw: string) {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
}

type ApiResult = {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  admin_district: string | null;
  admin_ward: string | null;
  region: string | null;
  country: string | null;
};

export async function lookupPostcode(raw: string, init?: RequestInit): Promise<Lookup> {
  if (!POSTCODE_SHAPE.test(raw.trim())) return { status: "invalid" };
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(raw.replace(/\s+/g, ""))}`, init);
    if (res.status === 404) return { status: "invalid" };
    if (!res.ok) return { status: "unavailable" };
    const r: ApiResult = (await res.json()).result;
    // A few valid postcodes (e.g. PO boxes) have no location.
    if (r.latitude === null || r.longitude === null) return { status: "invalid" };
    return {
      status: "found",
      place: {
        postcode: r.postcode,
        lat: r.latitude,
        lng: r.longitude,
        district: r.admin_district ?? r.region ?? r.country ?? "",
        ward: r.admin_ward ?? "",
        region: r.region ?? r.country ?? "",
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}

/** Server-side lookup for dashboard pages; postcodes rarely move, so cache for a month. */
export async function placeFor(postcode: string) {
  const result = await lookupPostcode(postcode, { cache: "force-cache", next: { revalidate: 60 * 60 * 24 * 30 } });
  return result.status === "found" ? result.place : null;
}

/** "RG1 3EU, Reading" when we know the area, else just the postcode. */
export function areaLabel(postcode: string, place: Place | null) {
  return place?.district ? `${postcode}, ${place.district}` : postcode;
}
