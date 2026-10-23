// Snapshots real businesses from OpenStreetMap (Overpass API) into lib/data/. Re-run to refresh:
//   node scripts/fetch-osm-businesses.mjs              → 10 miles around Maidenhead (maidenhead-businesses.json)
//   node scripts/fetch-osm-businesses.mjs berkshire    → inside the county boundary (berkshire-businesses.json,
//                                                         plus berkshire-outline.json, a simplified boundary)
// Data © OpenStreetMap contributors, ODbL.
import { writeFile } from "node:fs/promises";

const TOWN = { slug: "maidenhead", name: "Maidenhead", lat: 51.5227, lng: -0.7202 };
const RADIUS_M = 16_100; // 10 miles, the largest radius the app offers
// A whole county instead: its ceremonial boundary relation in OpenStreetMap.
const COUNTY = process.argv[2] === "berkshire" ? { slug: "berkshire", name: "Berkshire" } : null;
const AREA = COUNTY ? `area["name"="${COUNTY.name}"]["boundary"="ceremonial"]->.a;` : "";
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
  const where = COUNTY ? "(area.a)" : `(around:${RADIUS_M},${TOWN.lat},${TOWN.lng})`;
  const q = `[out:json][timeout:120];${AREA}nwr${where}[${selector}];out center tags;`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rivl-poc/0.1" },
      body: new URLSearchParams({ data: q }),
    });
    if (res.ok) {
      const text = await res.text();
      // Overpass sometimes answers 200 with an HTML error page when busy.
      if (text.startsWith("{")) return JSON.parse(text).elements;
    }
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
  ...(COUNTY ? { county: COUNTY } : { town: TOWN, radiusMiles: 10 }),
  fetched: new Date().toISOString().slice(0, 10),
  attribution: "© OpenStreetMap contributors (ODbL)",
  businesses,
};
const slug = COUNTY?.slug ?? TOWN.slug;
await writeFile(new URL(`../lib/data/${slug}-businesses.json`, import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`Saved ${businesses.length} businesses`);

if (COUNTY) {
  // The county's outline, simplified to about 100 m, for telling when a search circle runs past the data's edge.
  const q = `[out:json][timeout:120];relation["name"="${COUNTY.name}"]["boundary"="ceremonial"];out geom;`;
  let rel;
  for (let attempt = 0; attempt < 6 && !rel; attempt++) {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rivl-poc/0.1" }, body: new URLSearchParams({ data: q }) });
    const text = res.ok ? await res.text() : "";
    if (text.startsWith("{")) rel = JSON.parse(text).elements[0];
    else await new Promise((r) => setTimeout(r, 5000 * 2 ** attempt));
  }
  if (!rel) throw new Error("Overpass kept failing for the county outline");
  const rings = joinRings(rel.members.filter((m) => m.type === "way" && m.role === "outer").map((m) => m.geometry.map((p) => [p.lon, p.lat])));
  const outline = rings.map((r) => simplify(r, 0.001).map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5]));
  await writeFile(new URL(`../lib/data/${slug}-outline.json`, import.meta.url), JSON.stringify({ name: COUNTY.name, rings: outline }) + "\n");
  console.log(`Saved outline: ${outline.map((r) => r.length).join(", ")} points`);
}

/** Joins boundary ways that share end points into closed rings. */
function joinRings(ways) {
  const rings = [];
  const left = ways.map((w) => [...w]);
  while (left.length) {
    let ring = left.shift();
    for (let grown = true; grown && !same(ring[0], ring.at(-1)); ) {
      grown = false;
      for (let i = 0; i < left.length; i++) {
        const w = left[i];
        if (same(ring.at(-1), w[0])) ring = ring.concat(w.slice(1));
        else if (same(ring.at(-1), w.at(-1))) ring = ring.concat(w.slice(0, -1).reverse());
        else if (same(ring[0], w.at(-1))) ring = w.slice(0, -1).concat(ring);
        else if (same(ring[0], w[0])) ring = w.slice(1).reverse().concat(ring);
        else continue;
        left.splice(i, 1);
        grown = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

function same(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/** Douglas–Peucker line simplification (tolerance in degrees). */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points.at(-1)];
  let maxD = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], a, b);
    if (d > maxD) [maxD, index] = [d, i];
  }
  if (maxD <= tolerance) return [a, b];
  return simplify(points.slice(0, index + 1), tolerance).slice(0, -1).concat(simplify(points.slice(index), tolerance));
}

function distanceToSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
