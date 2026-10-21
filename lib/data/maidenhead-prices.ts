import type { Business } from "../markets";

/**
 * Real, published prices for Maidenhead-area gyms and barbers, read from each business's
 * own website. Keyed by OpenStreetMap id (or "extra/…" for businesses OSM is
 * missing). Only record a price you've seen on the business's own page, with
 * the page and the date; never estimate.
 *
 * Like-for-like items are defined per sector in lib/sectors.ts. A barber's
 * own booking page (Booksy, Fresha) counts as their own published prices.
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
const CHECKED_21 = "2026-10-21";
const NOT_PUBLISHED = "Not published online";
const ON_REQUEST = "Price on request";

/** Businesses missing from OpenStreetMap, placed by their postcode. */
export const MAIDENHEAD_EXTRA: Business[] = [
  { osm: "extra/braywick", name: "Braywick Leisure Centre", sector: "Gym", lat: 51.515484, lng: -0.719057, address: "Braywick Road, Maidenhead, SL6 1BN", website: "https://leisurefocus.org.uk/our-centres/braywick-leisure-centre/" },
  { osm: "extra/cox-green", name: "Cox Green Leisure Centre", sector: "Gym", lat: 51.508438, lng: -0.755393, address: "Highfield Lane, Maidenhead, SL6 3AX" },
  { osm: "extra/furze-platt", name: "Furze Platt Leisure Centre", sector: "Gym", lat: 51.535825, lng: -0.739118, address: "101 Furze Platt Road, Maidenhead, SL6 7NQ" },
  { osm: "extra/bart-barbers", name: "BART Barbers", sector: "Barber", lat: 51.521836, lng: -0.723606, address: "New Market, King Street, Maidenhead, SL6 1DS", website: "https://booksy.com/en-gb/117146_bart-barbers_barber_1016048_maidenhead" },
  { osm: "extra/unit1-barbers", name: "Unit1 Barbers", sector: "Barber", lat: 51.503625, lng: -0.762858, address: "Unit 1, Cannon Lane, Maidenhead, SL6 3NR", website: "https://booksy.com/en-gb/84741_unit1barbers_barber_1016048_maidenhead" },
  { osm: "extra/anytime-maidenhead", name: "Anytime Fitness Maidenhead", sector: "Gym", lat: 51.521446, lng: -0.71752, address: "Cooper Court, Maidenhead, SL6 1LF", website: "https://www.anytimefitness.com/en-gb/locations/maidenhead-south-east-uk-0439" },
];

/** OpenStreetMap entries that aren't separate comparable businesses (e.g. duplicates), with the reason. */
export const MAIDENHEAD_NOT_COMPARABLE: Record<string, string> = {
  "node/11848622992": "Duplicate of node/11848513760: a second LynnNails pin 250 m away, with no sign of a second branch",
};

/** OpenStreetMap entries filed under the wrong sector. */
export const MAIDENHEAD_SECTOR_FIXES: Record<string, string> = {
  "node/2324275993": "Hair salon", // Toni & Guy: unisex salon, tagged as men's in OSM
};

export const MAIDENHEAD_PRICES: Record<string, PriceRecord> = {
  // Nail bars, checked 21 Oct 2026
  "way/838578603": {
    name: "Cookham’s Nail Bar",
    prices: { gel_mani: 30, infills: 20, removal: 12 },
    url: "https://www.treatwell.co.uk/place/cookhams-nail-bar/",
    checked: CHECKED_21,
    caveat: "Shellac/gel manicure; infills listed as “Nail Extensions - Permanent White Infills”.",
  },
  "node/2364995710": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/2364966132": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/2364947091": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/11848513760": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },

  // Beauty salons, checked 21 Oct 2026
  "way/944325151": {
    name: "Marianna’s Hair and Beauty",
    prices: { brow_wax: 18, lash_tint: 19, leg_wax: 50, facial: 70, massage: 70 },
    url: "https://www.fresha.com/a/mariannas-hair-and-beauty-maidenhead-9-norfolk-road-fgj48myv",
    checked: CHECKED_21,
    caveat: "Facial is the 60-minute facial; massage is a 60-minute Swedish full body massage.",
  },
  "node/5254338663": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/2364939050": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/5147989514": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/12116542419": { prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },
  "node/12062135318": { name: "MK Beauty", prices: {}, checked: CHECKED_21, note: NOT_PUBLISHED },

  // Barbers, checked 20 Oct 2026
  "node/2364966126": {
    prices: { haircut: 18, skin_fade: 23, beard_trim: 9.5 },
    url: "https://radsbarbers.co.uk/prices",
    checked: CHECKED,
    caveat: "Listed as “from” prices. No combined cut-and-beard or children’s price published.",
  },
  "extra/bart-barbers": {
    prices: { haircut: 20, skin_fade: 25, beard_trim: 9, cut_beard: 29, kids_cut: 14 },
    url: "https://booksy.com/en-gb/117146_bart-barbers_barber_1016048_maidenhead",
    checked: CHECKED,
    caveat: "Full prices, listed as “from”; booking online on Booksy saves up to 10%. Beard is “Beard grooming/Line up”.",
  },
  "extra/unit1-barbers": {
    prices: { haircut: 22, skin_fade: 24, beard_trim: 12, cut_beard: 32, kids_cut: 17 },
    url: "https://booksy.com/en-gb/84741_unit1barbers_barber_1016048_maidenhead",
    checked: CHECKED,
    caveat: "Children’s price is boys aged 5 to 12 (£14 for under 5s).",
  },
  "node/2364947089": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/2724164176": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/2364897635": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/5254308142": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/12105470661": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/12105470670": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "way/1257177516": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/2724164134": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "way/547090023": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },
  "node/12691171042": { prices: {}, checked: CHECKED, note: NOT_PUBLISHED },

  // Gyms, checked 20 Oct 2026
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
