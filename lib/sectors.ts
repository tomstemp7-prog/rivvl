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

/** Standard comparable items per sector. Only gyms are filled in for now. */
export const PRICE_ITEMS: Record<string, { id: string; label: string; detail: string }[]> = {
  Gym: [
    { id: "monthly", label: "Monthly membership", detail: "Peak, rolling, no contract" },
    { id: "offpeak", label: "Off-peak membership", detail: "Daytime and weekend access" },
    { id: "daypass", label: "Day pass", detail: "Single visit, non-member" },
    { id: "pt", label: "Personal training", detail: "One-hour session" },
    { id: "joining", label: "Joining fee", detail: "One-off, if you charge one" },
  ],
};

export function itemsFor(sector: string) {
  return PRICE_ITEMS[sector] ?? PRICE_ITEMS.Gym;
}
