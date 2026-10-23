import { marketFor, realRegionFor } from "@/lib/markets";
import { radiusMiles, rivalsWithin } from "@/lib/mock-market";
import { placeFor } from "@/lib/postcode";
import { circleCovered, loadTown } from "@/lib/town-data";

/**
 * How many businesses of a sector are near a postcode, for the sign-up form.
 * Runs on the server so the business list never ships to the browser.
 * Only covered regions have a real count; elsewhere it says so rather than
 * counting sample data. `partial` means the circle reaches past the edge of
 * the region's business list, so the real number is at least `count`.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postcode = params.get("postcode") ?? "";
  const sector = params.get("sector") ?? "Gym";
  const radius = params.get("radius") ?? "3 miles";
  const place = await placeFor(postcode);
  const market = await marketFor(sector, postcode, place);
  if (!market.real || !place) return Response.json({ real: false, count: null, partial: false });
  const region = realRegionFor(place);
  const area = region ? await loadTown(region.name) : null;
  const partial = !!area && !circleCovered(area, place, radiusMiles(radius));
  return Response.json({ real: true, count: rivalsWithin(radius, market.rivals).length, partial });
}
