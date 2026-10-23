/**
 * Where Rivl has real businesses: whole council areas, so the edges follow
 * real boundaries (a postcode's council comes from postcodes.io). Kept free
 * of data imports so browser code can check a postcode cheaply.
 */
export const REGIONS = [
  {
    name: "Berkshire",
    councils: ["Bracknell Forest", "Reading", "Slough", "West Berkshire", "Windsor and Maidenhead", "Wokingham"],
  },
];

/** Towns where published prices have been researched so far. Elsewhere in a region, businesses show without prices. */
export const PRICED_TOWNS = ["Maidenhead"];

/** The region a council belongs to, or null outside them. */
export function regionFor(council: string | null | undefined) {
  return REGIONS.find((r) => r.councils.includes(council ?? "")) ?? null;
}

/** "sl6 7aa" → "SL6"; "SL67AA" → "SL6". */
export function outcodeOf(postcode: string) {
  const compact = postcode.replace(/\s+/g, "").toUpperCase();
  return compact.length > 3 ? compact.slice(0, -3) : compact;
}
