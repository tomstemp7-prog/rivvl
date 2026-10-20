import type { Business } from "../markets";

/**
 * Real, published prices for Maidenhead-area gyms, read from each business's
 * own website. Keyed by OpenStreetMap id (or "extra/…" for businesses OSM is
 * missing). Only record a price you've seen on the business's own page, with
 * the page and the date; never estimate.
 *
 * Like-for-like items (see lib/sectors.ts): monthly = peak, rolling, no
 * contract; offpeak; daypass = single visit, non-member; pt = one hour;
 * joining = one-off fee.
 */
export type PriceRecord = {
  prices: Record<string, number>;
  /** Page the prices were read from. */
  url?: string;
  /** ISO date the page was checked. */
  checked: string;
  /** Shown instead of a price when none is published. */
  note?: string;
  /** What the price includes or how it differs from the standard item. */
  caveat?: string;
  /** Clearer display name, e.g. to tell two PureGyms apart. */
  name?: string;
};

const CHECKED = "2026-10-20";
const NOT_PUBLISHED = "Not published online";
const ON_REQUEST = "Price on request";

/** Businesses missing from OpenStreetMap, placed by their postcode. */
export const MAIDENHEAD_EXTRA: Business[] = [
  { osm: "extra/braywick", name: "Braywick Leisure Centre", sector: "Gym", lat: 51.515484, lng: -0.719057, address: "Braywick Road, Maidenhead, SL6 1BN", website: "https://leisurefocus.org.uk/our-centres/braywick-leisure-centre/" },
  { osm: "extra/cox-green", name: "Cox Green Leisure Centre", sector: "Gym", lat: 51.508438, lng: -0.755393, address: "Highfield Lane, Maidenhead, SL6 3AX" },
  { osm: "extra/furze-platt", name: "Furze Platt Leisure Centre", sector: "Gym", lat: 51.535825, lng: -0.739118, address: "101 Furze Platt Road, Maidenhead, SL6 7NQ" },
  { osm: "extra/anytime-maidenhead", name: "Anytime Fitness Maidenhead", sector: "Gym", lat: 51.521446, lng: -0.71752, address: "Cooper Court, Maidenhead, SL6 1LF", website: "https://www.anytimefitness.com/en-gb/locations/maidenhead-south-east-uk-0439" },
];

export const MAIDENHEAD_PRICES: Record<string, PriceRecord> = {
  "node/14017045853": {
    name: "PureGym Maidenhead",
    prices: { monthly: 32.99, joining: 19.99 },
    url: "https://www.puregym.com/gyms/maidenhead/",
    checked: CHECKED,
    caveat: "Core membership.",
  },
  "extra/braywick": {
    prices: { monthly: 78.5 },
    url: "https://www.leisurefocus.org.uk/our-centres/braywick-leisure-centre/memberships-app-download/",
    checked: CHECKED,
    caveat: "Adult Flexi: gym, swim and classes at every Leisure Focus centre.",
  },
  "extra/cox-green": {
    prices: { monthly: 39.5, joining: 20 },
    url: "https://leisurefocus.org.uk/our-centres/cox-green-leisure-centre/membership-app-download/",
    checked: CHECKED,
    caveat: "Single Site Adult Flexi.",
  },
  "extra/furze-platt": {
    prices: { monthly: 44.15 },
    url: "https://leisurefocus.org.uk/our-centres/furze-platt-leisure-centre/membership-app-download/",
    checked: CHECKED,
    caveat: "Single Site Adult Flexi. A joining fee applies; the amount isn’t published.",
  },
  "node/2364897631": {
    prices: { monthly: 75, daypass: 12 },
    url: "https://www.monkeymuaythai.co.uk/prices/",
    checked: CHECKED,
    caveat: "Muay Thai club: adult class membership; the day pass is one class.",
  },
  "way/393239080": {
    name: "PureGym Burnham",
    prices: { monthly: 25.99, offpeak: 18.99, joining: 0 },
    url: "https://www.puregym.com/gyms/burnham/",
    checked: CHECKED,
    caveat: "Core membership (first month discounted at the time of checking).",
  },
  "way/705065002": {
    name: "The Gym Group Slough",
    prices: { monthly: 25.99, offpeak: 19.99, daypass: 9.99, joining: 15 },
    url: "https://www.thegymgroup.com/find-a-gym/slough-gyms/slough/",
    checked: CHECKED,
    caveat: "Standard membership; advertised as “from” prices.",
  },
  "node/5620566727": {
    prices: { monthly: 53 },
    url: "https://www.placesleisure.org/centres/court-garden-leisure-complex/",
    checked: CHECKED,
    caveat: "Premium (gym, swim and classes), advertised as “from £53”.",
  },
  "way/114709119": {
    prices: { monthly: 78.5 },
    url: "https://leisurefocus.org.uk/our-centres/windsor-leisure-centre/membership-app-download/",
    checked: CHECKED,
    caveat: "Adult Flexi: gym, swim and classes at every Leisure Focus centre.",
  },
  "node/2421932504": {
    name: "David Lloyd Maidenhead",
    prices: {},
    url: "https://www.davidlloyd.co.uk/clubs/maidenhead/",
    checked: CHECKED,
    note: ON_REQUEST,
  },
  "extra/anytime-maidenhead": {
    prices: {},
    url: "https://www.anytimefitness.com/en-gb/locations/maidenhead-south-east-uk-0439",
    checked: CHECKED,
    note: ON_REQUEST,
  },
  "node/11062885063": { name: "F45 Training Maidenhead", prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/12105470655": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/11808335639": { name: "ICON Gym Maidenhead", prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/12305044757": { name: "The Loft at Burnham", prices: {}, checked: CHECKED, note: "Members only" },
};
