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
  const pooled = profile.shared ? await pooledPrices(profile.sector, place, profile.id) : {};
  const market = await marketFor(profile.sector, profile.postcode, place);

  return (
    <DashboardShell current="/dashboard" profile={profile}>
      <MarketView profile={profile} place={place} market={market} pooled={pooled} />
    </DashboardShell>
  );
}
