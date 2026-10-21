import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { marketFor } from "@/lib/markets";
import { placeFor } from "@/lib/postcode";
import { pooledPrices, resolveProfile } from "@/lib/sites";
import { MarketView } from "./market-view";

export const metadata: Metadata = { title: "Your local market · Rivl" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await resolveProfile(await searchParams);
  const place = await placeFor(profile.postcode);
  const market = await marketFor(profile.sector, profile.postcode, place);
  // Owner-shared prices are real, so they only join real markets, never the sample data.
  const pooled = profile.shared && market.real ? await pooledPrices(profile.sector, place, profile.id) : {};

  return (
    <DashboardShell current="/dashboard" profile={profile}>
      <MarketView profile={profile} place={place} market={market} pooled={pooled} />
    </DashboardShell>
  );
}
