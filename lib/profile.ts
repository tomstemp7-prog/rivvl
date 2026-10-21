import { DEMO_PROFILE } from "./mock-market";
import { RADII, SECTORS } from "./sectors";

/**
 * Sign-up answers travel between steps (and into the dashboard) as URL query
 * params until there's a real backend. Prices use `p_<itemId>` keys.
 */
export type Profile = {
  /** Set once the sign-up is saved: links then carry `site=<id>` instead of the whole profile. */
  id?: string;
  /** True when the signed-in viewer owns this saved business (they can edit it). */
  owned?: boolean;
  name: string;
  sector: string;
  postcode: string;
  radius: string;
  shared: boolean;
  prices: Record<string, number>;
};

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseProfile(params: Params): Profile {
  const sector = first(params.sector);
  const radius = first(params.radius);
  const prices: Record<string, number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith("p_")) continue;
    const n = parsePrice(first(value));
    if (n !== null) prices[key.slice(2)] = n;
  }
  return {
    name: first(params.name),
    sector: SECTORS.some((s) => s.label === sector) ? sector : "Gym",
    postcode: first(params.postcode).toUpperCase(),
    radius: (RADII as readonly string[]).includes(radius) ? radius : "3 miles",
    shared: first(params.shared) === "1",
    prices,
  };
}

/** Dashboard pages fall back to the demo business when no profile is in the URL. */
export function profileOrDemo(params: Params): Profile {
  const parsed = parseProfile(params);
  return parsed.name ? parsed : DEMO_PROFILE;
}

export function profileQuery(p: Partial<Profile>) {
  const q = new URLSearchParams();
  if (p.id) {
    q.set("site", p.id);
    return q.toString();
  }
  if (p.name) q.set("name", p.name);
  if (p.sector) q.set("sector", p.sector);
  if (p.postcode) q.set("postcode", p.postcode);
  if (p.radius) q.set("radius", p.radius);
  if (p.shared !== undefined) q.set("shared", p.shared ? "1" : "0");
  for (const [id, price] of Object.entries(p.prices ?? {})) q.set(`p_${id}`, String(price));
  return q.toString();
}

export function parsePrice(raw: string): number | null {
  const n = Number(raw.replace(/[£,\s]/g, ""));
  return raw.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatPrice(n: number) {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}
