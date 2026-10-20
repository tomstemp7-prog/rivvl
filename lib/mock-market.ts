import type { Profile } from "./profile";

/**
 * Illustrative market data for the dashboard. All names and prices are dummy
 * data; every sector currently reuses the gym set.
 *
 * Months are "YYYY-MM" strings. `prices` are today's prices; `changes` record
 * how they got there, so any past month can be reconstructed with `priceAt`.
 */
export type PriceChange = { itemId: string; from: number; to: number; month: string };

export type Rival = {
  id: string;
  name: string;
  short: string;
  miles: number;
  segment: string;
  /** Bearing on the map in degrees, 0 = east, clockwise. */
  bearing: number;
  prices: Record<string, number>;
  note?: { text: string; tone: "up" | "new" };
  /** First month Rivl tracked them; for new openings, the month they opened. */
  firstSeen: string;
  changes?: PriceChange[];
  source: "public website" | "owner";
  /** Date the prices were last checked (ISO). */
  checked: string;
};

export const MOCK_UPDATED = "14 Oct 2026";
export const MOCK_TODAY = "2026-10-14";
export const MOCK_MONTH = "2026-10";
/** When Rivl started tracking this market. */
export const TRACKING_START = "2025-04";

export const SEGMENT_LABELS: Record<string, string> = {
  budget: "Budget, 24/7",
  council: "Council leisure centre",
  "mid-market": "Mid-market gym",
  strength: "Strength and conditioning",
  boutique: "Boutique studio",
  functional: "Functional fitness",
};

export const MOCK_YOUR_PRICES: Record<string, number> = {
  monthly: 39,
  offpeak: 29,
  daypass: 10,
  pt: 40,
};

export const RIVALS: Rival[] = [
  { id: "flexigym", name: "FlexiGym 24/7", short: "FlexiGym", miles: 0.9, segment: "budget", bearing: 250,
    prices: { monthly: 24.99, offpeak: 19.99, daypass: 6, joining: 0 },
    firstSeen: "2025-04", source: "public website", checked: "2026-10-06" },
  { id: "riverside", name: "Riverside Leisure Centre", short: "Riverside", miles: 1.4, segment: "council", bearing: 340,
    prices: { monthly: 32, offpeak: 24, daypass: 7.5, pt: 30, joining: 15 },
    firstSeen: "2025-04", source: "public website", checked: "2026-09-02" },
  { id: "kennet", name: "Kennet Yoga & Fitness", short: "Kennet", miles: 1.1, segment: "mid-market", bearing: 60,
    prices: { monthly: 42, offpeak: 30, daypass: 10, pt: 42, joining: 20 },
    firstSeen: "2025-04", source: "owner", checked: "2026-10-10",
    changes: [
      { itemId: "monthly", from: 37, to: 39, month: "2026-01" },
      { itemId: "monthly", from: 39, to: 42, month: "2026-04" },
      { itemId: "daypass", from: 9, to: 10, month: "2026-08" },
    ] },
  { id: "forge", name: "Forge Strength Club", short: "Forge", miles: 1.8, segment: "strength", bearing: 115,
    prices: { monthly: 45, offpeak: 35, daypass: 12, pt: 45, joining: 25 },
    note: { text: "Up £3 in Sep", tone: "up" },
    firstSeen: "2025-04", source: "public website", checked: "2026-10-08",
    changes: [{ itemId: "monthly", from: 42, to: 45, month: "2026-09" }] },
  { id: "peak", name: "Peak Performance Studio", short: "Peak", miles: 2.2, segment: "boutique", bearing: 300,
    prices: { monthly: 55, offpeak: 45, daypass: 15, pt: 55 },
    firstSeen: "2025-04", source: "public website", checked: "2026-08-20" },
  { id: "northside", name: "Northside Functional", short: "Northside", miles: 2.6, segment: "functional", bearing: 180,
    prices: { monthly: 80, offpeak: 60, daypass: 15, pt: 60, joining: 30 },
    note: { text: "New in your area", tone: "new" },
    firstSeen: "2026-09", source: "public website", checked: "2026-10-12" },
  { id: "thames", name: "Thames Valley Fitness", short: "Thames Valley", miles: 3.8, segment: "mid-market", bearing: 20,
    prices: { monthly: 38, offpeak: 28, daypass: 9, pt: 38, joining: 10 },
    firstSeen: "2025-04", source: "owner", checked: "2026-10-01" },
  { id: "caversham", name: "Caversham CrossFit", short: "Caversham", miles: 4.6, segment: "boutique", bearing: 220,
    prices: { monthly: 65, daypass: 14, pt: 50 },
    note: { text: "Up £5 in Aug", tone: "up" },
    firstSeen: "2025-04", source: "public website", checked: "2026-10-03",
    changes: [{ itemId: "monthly", from: 60, to: 65, month: "2026-08" }] },
  { id: "southcote", name: "Southcote Sports Hub", short: "Southcote", miles: 7.2, segment: "council", bearing: 150,
    prices: { monthly: 27, offpeak: 21, daypass: 6.5, pt: 32 },
    firstSeen: "2025-04", source: "public website", checked: "2026-07-30" },
];

/** Shown when someone lands on the dashboard without going through sign-up (e.g. "Log in"). */
export const DEMO_PROFILE: Profile = {
  name: "Iron & Oak Fitness",
  sector: "Gym",
  postcode: "RG1 3EU",
  radius: "3 miles",
  shared: true,
  prices: MOCK_YOUR_PRICES,
};

export const radiusMiles = (radius: string) => parseFloat(radius);

export function rivalsWithin(radius: string) {
  const max = radiusMiles(radius);
  return RIVALS.filter((r) => r.miles <= max);
}

export function median(values: number[]) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const getRival = (id: string) => RIVALS.find((r) => r.id === id);

/**
 * The limited view hides who's who until the owner shares their prices. Letters
 * follow RIVALS order, which matches the market map's default (monthly) view.
 */
export function rivalName(rival: Rival, profile: Profile, short = false) {
  if (profile.shared) return short ? rival.short : rival.name;
  const letter = String.fromCharCode(65 + RIVALS.indexOf(rival));
  return short ? letter : `${profile.sector} ${letter}`;
}

/* ---------- Months ---------- */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const i = y * 12 + (m - 1) + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

/** Inclusive list of months from `from` to `to`. */
export function monthRange(from: string, to: string) {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function monthName(month: string, style: "long" | "short" | "axis" = "long") {
  const [y, m] = month.split("-").map(Number);
  const name = MONTHS[m - 1];
  if (style === "short") return name.slice(0, 3);
  if (style === "axis") return `${name.slice(0, 3)} ’${String(y).slice(2)}`;
  return `${name} ${y}`;
}

export function quarterName(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `Q${Math.ceil(m / 3)} ’${String(y).slice(2)}`;
}

/* ---------- History ---------- */

/** A rival's price for an item at the end of `month`, or null if not tracked yet. */
export function priceAt(rival: Rival, itemId: string, month: string) {
  if (month < rival.firstSeen || rival.prices[itemId] === undefined) return null;
  let price = rival.prices[itemId];
  const later = (rival.changes ?? [])
    .filter((c) => c.itemId === itemId && c.month > month)
    .sort((a, b) => b.month.localeCompare(a.month));
  for (const c of later) price = c.from;
  return price;
}

/** Rivals within the radius that Rivl was tracking by the end of `month`. */
export function rivalsAt(radius: string, month: string) {
  return rivalsWithin(radius).filter((r) => r.firstSeen <= month);
}

/** Area median for an item at a month: tracked rivals plus your own price, if shared. */
export function medianAt(radius: string, itemId: string, month: string, yourPrice: number | null) {
  const values = rivalsAt(radius, month)
    .map((r) => priceAt(r, itemId, month))
    .filter((p): p is number => p !== null);
  if (yourPrice !== null) values.push(yourPrice);
  return median(values);
}

/* ---------- Reports ---------- */

export type Report = {
  id: string;
  label: string;
  kind: "Monthly" | "Quarterly";
  /** Each report looks back over the three months up to and including `to`. */
  to: string;
};

export const REPORTS: Report[] = [
  { id: "2026-10", label: "October 2026", kind: "Monthly", to: "2026-09" },
  { id: "2026-q3", label: "Q3 2026 review", kind: "Quarterly", to: "2026-09" },
  { id: "2026-09", label: "September 2026", kind: "Monthly", to: "2026-08" },
  { id: "2026-08", label: "August 2026", kind: "Monthly", to: "2026-07" },
  { id: "2026-07", label: "July 2026", kind: "Monthly", to: "2026-06" },
];

export type MarketEvent =
  | { kind: "change"; rival: Rival; change: PriceChange }
  | { kind: "opened"; rival: Rival; month: string };

/** Price changes and openings within the radius between two months, newest first. */
export function eventsBetween(radius: string, from: string, to: string): MarketEvent[] {
  const events: MarketEvent[] = [];
  for (const rival of rivalsWithin(radius)) {
    // Rivals seen since tracking began count as openings.
    if (rival.firstSeen > TRACKING_START && rival.firstSeen >= from && rival.firstSeen <= to) {
      events.push({ kind: "opened", rival, month: rival.firstSeen });
    }
    for (const change of rival.changes ?? []) {
      if (change.month >= from && change.month <= to) events.push({ kind: "change", rival, change });
    }
  }
  const month = (e: MarketEvent) => (e.kind === "change" ? e.change.month : e.month);
  return events.sort((a, b) => month(b).localeCompare(month(a)));
}
