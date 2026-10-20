export const SECTORS = [
  { label: "Gym", heading: "Gyms", plural: "gyms" },
  { label: "Hair salon", heading: "Hair salons", plural: "hair salons" },
  { label: "Barber", heading: "Barbers", plural: "barbers" },
  { label: "Coffee shop", heading: "Coffee shops", plural: "coffee shops" },
  { label: "Beauty salon", heading: "Beauty salons", plural: "beauty salons" },
  { label: "Nail bar", heading: "Nail bars", plural: "nail bars" },
  { label: "Yoga and pilates", heading: "Yoga and pilates", plural: "yoga and pilates studios" },
  { label: "Physio", heading: "Physio", plural: "physios" },
] as const;

export const RADII = ["1 mile", "3 miles", "5 miles", "10 miles"] as const;

export function pluralFor(sector: string) {
  return SECTORS.find((s) => s.label === sector)?.plural ?? "businesses";
}

export type PriceItem = {
  id: string;
  label: string;
  /** What exactly is being compared, so prices are like for like. */
  detail: string;
  /** How the customer pays for it, e.g. "per month", "per appointment". */
  per: string;
  /** Compact label for table columns. */
  short: string;
};

/**
 * Standard comparable items per sector, matched to what each kind of business
 * sells and how its customers pay: memberships for gyms, appointments for
 * salons, cups for cafés, classes and passes for studios.
 */
export const PRICE_ITEMS: Record<string, PriceItem[]> = {
  Gym: [
    { id: "monthly", label: "Monthly membership", short: "Monthly", per: "per month", detail: "Peak, rolling, no contract" },
    { id: "offpeak", label: "Off-peak membership", short: "Off-peak", per: "per month", detail: "Daytime and weekend access" },
    { id: "daypass", label: "Day pass", short: "Day pass", per: "per visit", detail: "Single visit, non-member" },
    { id: "pt", label: "Personal training", short: "PT", per: "per session", detail: "One-hour session" },
    { id: "joining", label: "Joining fee", short: "Joining", per: "one-off", detail: "One-off, if you charge one" },
  ],
  "Hair salon": [
    { id: "womens_cut", label: "Women’s cut and blow-dry", short: "Women’s cut", per: "per appointment", detail: "Wash, cut and finish, senior stylist" },
    { id: "mens_cut", label: "Men’s cut", short: "Men’s cut", per: "per appointment", detail: "Wash and cut" },
    { id: "blow_dry", label: "Blow-dry", short: "Blow-dry", per: "per appointment", detail: "Wash and blow-dry, medium-length hair" },
    { id: "full_colour", label: "Full head colour", short: "Colour", per: "per appointment", detail: "Permanent tint, roots to ends" },
    { id: "highlights", label: "Half head highlights", short: "Highlights", per: "per appointment", detail: "Foils, medium-length hair" },
  ],
  Barber: [
    { id: "haircut", label: "Men’s haircut", short: "Haircut", per: "per cut", detail: "Scissor or clipper cut" },
    { id: "skin_fade", label: "Skin fade", short: "Skin fade", per: "per cut", detail: "Faded down to the skin" },
    { id: "beard_trim", label: "Beard trim", short: "Beard", per: "per visit", detail: "Shape and line-up" },
    { id: "cut_beard", label: "Haircut and beard", short: "Cut + beard", per: "per visit", detail: "Both in one appointment" },
    { id: "kids_cut", label: "Children’s cut", short: "Kids", per: "per cut", detail: "Under 12s" },
  ],
  "Coffee shop": [
    { id: "flat_white", label: "Flat white", short: "Flat white", per: "per cup", detail: "Regular size, dairy milk" },
    { id: "latte", label: "Latte", short: "Latte", per: "per cup", detail: "Regular size, dairy milk" },
    { id: "americano", label: "Americano", short: "Americano", per: "per cup", detail: "Regular size" },
    { id: "tea", label: "Tea", short: "Tea", per: "per cup", detail: "Regular cup or pot for one" },
    { id: "croissant", label: "Croissant", short: "Croissant", per: "each", detail: "Plain, eat in" },
  ],
  "Beauty salon": [
    { id: "brow_wax", label: "Eyebrow wax", short: "Brows", per: "per treatment", detail: "Shape and tidy" },
    { id: "lash_tint", label: "Lash tint", short: "Lash tint", per: "per treatment", detail: "Including patch test" },
    { id: "leg_wax", label: "Full leg wax", short: "Leg wax", per: "per treatment", detail: "Hot or strip wax" },
    { id: "facial", label: "Facial", short: "Facial", per: "per treatment", detail: "60 minutes" },
    { id: "massage", label: "Full body massage", short: "Massage", per: "per treatment", detail: "60 minutes" },
  ],
  "Nail bar": [
    { id: "gel_mani", label: "Gel manicure", short: "Gel mani", per: "per appointment", detail: "Shape, cuticles and gel polish" },
    { id: "gel_pedi", label: "Gel pedicure", short: "Gel pedi", per: "per appointment", detail: "Soak, shape and gel polish" },
    { id: "acrylic_full", label: "Acrylic full set", short: "Acrylics", per: "per set", detail: "With gel polish" },
    { id: "infills", label: "Acrylic infills", short: "Infills", per: "per appointment", detail: "Two to three weeks after a full set" },
    { id: "removal", label: "Gel removal", short: "Removal", per: "per appointment", detail: "Soak-off, no new set" },
  ],
  "Yoga and pilates": [
    { id: "drop_in", label: "Drop-in class", short: "Drop-in", per: "per class", detail: "One group class, no membership" },
    { id: "class_pack", label: "10-class pass", short: "10 classes", per: "per pass", detail: "Ten group classes" },
    { id: "unlimited", label: "Unlimited membership", short: "Unlimited", per: "per month", detail: "Unlimited group classes, rolling" },
    { id: "private", label: "Private session", short: "Private", per: "per session", detail: "One hour, one to one" },
  ],
  Physio: [
    { id: "initial", label: "Initial assessment", short: "Initial", per: "per appointment", detail: "First appointment, 45 to 60 minutes" },
    { id: "follow_up", label: "Follow-up session", short: "Follow-up", per: "per appointment", detail: "30 minutes" },
    { id: "sports_massage", label: "Sports massage", short: "Massage", per: "per session", detail: "60 minutes" },
  ],
};

/** How each kind of business usually charges, shown where owners enter prices. */
export const CHARGING: Record<string, string> = {
  Gym: "Gyms mostly charge a monthly membership, with day passes and personal training paid per visit.",
  "Hair salon": "Salons charge per appointment, priced by the service and the stylist.",
  Barber: "Barbers charge per cut, usually walk-in or booked, with extras like beard work priced separately.",
  "Coffee shop": "Coffee shops charge per item, so we compare the drinks and bakes most customers buy.",
  "Beauty salon": "Beauty salons charge per treatment, priced by time and type.",
  "Nail bar": "Nail bars charge per appointment or set, with infills and removals priced separately.",
  "Yoga and pilates": "Studios mix pay-per-class, class passes and monthly unlimited memberships.",
  Physio: "Physios charge per appointment, with a longer first assessment.",
};

export function itemsFor(sector: string) {
  return PRICE_ITEMS[sector] ?? PRICE_ITEMS.Gym;
}
