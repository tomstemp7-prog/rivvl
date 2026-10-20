// Snapshots real businesses around a town from OpenStreetMap (Overpass API)
// into lib/data/<town>-businesses.json. Re-run to refresh:
//   node scripts/fetch-osm-businesses.mjs
// Data © OpenStreetMap contributors, ODbL.
import { writeFile } from "node:fs/promises";

const TOWN = { slug: "maidenhead", name: "Maidenhead", lat: 51.5227, lng: -0.7202 };
const RADIUS_M = 16_100; // 10 miles, the largest radius the app offers
const ENDPOINT = "https://overpass-api.de/api/interpreter";

/** OSM tag queries, one request each (small queries survive Overpass load better). */
const QUERIES = [
  'leisure="fitness_centre"',
  'leisure="sports_centre"',
  'shop="hairdresser"',
  'shop="beauty"',
  'amenity="cafe"',
  'healthcare="physiotherapist"',
];

/** Which Rivl sector a business belongs to, or null to skip it. */
function sectorFor(t) {
  const name = (t.name ?? "").toLowerCase();
  if (t.leisure === "fitness_centre" || t.leisure === "sports_centre") {
    if (/yoga|pilates/.test(name) || /yoga|pilates/.test(t.sport ?? "")) return "Yoga and pilates";
    if (t.leisure === "fitness_centre") return "Gym";
    // Sports centres only count when they offer a gym (sailing clubs, karting etc. don't).
    return /fitness|gym|multi/.test(t.sport ?? "") || /leisure|fitness|gym|david lloyd|health club/.test(name) ? "Gym" : null;
  }
  if (t.shop === "hairdresser") return t.hairdresser === "barber" || t.male === "yes" || /barber/.test(name) ? "Barber" : "Hair salon";
  if (t.shop === "beauty") return t.beauty === "nails" || /nail/.test(name) ? "Nail bar" : "Beauty salon";
  if (t.amenity === "cafe") return "Coffee shop";
  if (t.healthcare === "physiotherapist") return "Physio";
  return null;
}

async function overpass(selector) {
  const q = `[out:json][timeout:60];nwr(around:${RADIUS_M},${TOWN.lat},${TOWN.lng})[${selector}];out center tags;`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rivl-poc/0.1" },
      body: new URLSearchParams({ data: q }),
    });
    if (res.ok) return (await res.json()).elements;
    await new Promise((r) => setTimeout(r, 5000 * 2 ** attempt));
  }
  throw new Error(`Overpass kept failing for ${selector}`);
}

const seen = new Set();
const businesses = [];
for (const selector of QUERIES) {
  const elements = await overpass(selector);
  for (const e of elements) {
    const t = e.tags ?? {};
    const sector = sectorFor(t);
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (!sector || !t.name || lat == null || seen.has(`${e.type}/${e.id}`)) continue;
    seen.add(`${e.type}/${e.id}`);
    const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    businesses.push({
      osm: `${e.type}/${e.id}`,
      name: t.name,
      sector,
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      address: [street, t["addr:city"], t["addr:postcode"]].filter(Boolean).join(", ") || undefined,
      website: t.website ?? t["contact:website"] ?? undefined,
    });
  }
  console.log(`${selector}: ${elements.length} found`);
}

businesses.sort((a, b) => a.sector.localeCompare(b.sector) || a.name.localeCompare(b.name));
const out = {
  town: TOWN,
  radiusMiles: 10,
  fetched: new Date().toISOString().slice(0, 10),
  attribution: "© OpenStreetMap contributors (ODbL)",
  businesses,
};
await writeFile(new URL(`../lib/data/${TOWN.slug}-businesses.json`, import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`Saved ${businesses.length} businesses`);
