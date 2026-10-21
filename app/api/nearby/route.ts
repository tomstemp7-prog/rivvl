import { marketFor } from "@/lib/markets";
import { rivalsWithin } from "@/lib/mock-market";
import { placeFor } from "@/lib/postcode";

/**
 * How many businesses of a sector are near a postcode, for the sign-up form.
 * Runs on the server so the business list never ships to the browser.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postcode = params.get("postcode") ?? "";
  const sector = params.get("sector") ?? "Gym";
  const radius = params.get("radius") ?? "3 miles";
  const place = await placeFor(postcode);
  const market = await marketFor(sector, postcode, place);
  return Response.json({ count: rivalsWithin(radius, market.rivals).length, real: market.real });
}
