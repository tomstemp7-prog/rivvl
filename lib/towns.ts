/**
 * Towns where Rivl has real businesses and prices, by postcode outcode.
 * Kept free of data imports so browser code can check a postcode cheaply.
 */
export const LAUNCHED_TOWNS = [{ name: "Maidenhead", outcodes: ["SL6"] }];

/** "sl6 7aa" → "SL6"; "SL67AA" → "SL6". */
export function outcodeOf(postcode: string) {
  const compact = postcode.replace(/\s+/g, "").toUpperCase();
  return compact.length > 3 ? compact.slice(0, -3) : compact;
}

export function launchedTownFor(postcode: string) {
  const outcode = outcodeOf(postcode);
  return LAUNCHED_TOWNS.find((t) => t.outcodes.includes(outcode)) ?? null;
}
