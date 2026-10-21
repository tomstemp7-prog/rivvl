import { marketFor } from "@/lib/markets";
import { radiusMiles, rivalsWithin } from "@/lib/mock-market";
import { placeFor } from "@/lib/postcode";
import { loadTown } from "@/lib/town-data";

/**
 * How many businesses of a sector are near a postcode, for the sign-up form.
 * Runs on the server so the business list never ships to the browser.
 * Only launched towns have a real count; elsewhere it says so rather than
 * counting sample data. `partial` means the circle reaches past the edge of
 * the town's business list, so the real number is at least `count`.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postcode = params.get("postcode") ?? "";
  const sector = params.get("sector") ?? "Gym";
  const radius = params.get("radius") ?? "3 miles";
  const place = await placeFor(postcode);
  const market = await marketFor(sector, postcode, place);
  if (!market.real || !place) return Response.json({ real: false, count: null, partial: false });
  const town = await loadTown(market.town);
  const fromCentre = town ? Math.hypot((place.lat - town.centre.lat) * 69.05, (place.lng - town.centre.lng) * 69.05 * Math.cos((town.centre.lat * Math.PI) / 180)) : 0;
  const partial = !!town && fromCentre + radiusMiles(radius) > town.coverageMiles;
  return Response.json({ real: true, count: rivalsWithin(radius, market.rivals).length, partial });
}
