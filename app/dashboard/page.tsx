import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { marketFor } from "@/lib/markets";
import { placeFor } from "@/lib/postcode";
import { profileOrDemo } from "@/lib/profile";
import { MarketView } from "./market-view";

export const metadata: Metadata = { title: "Your local market · Rivl" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = profileOrDemo(await searchParams);
  const place = await placeFor(profile.postcode);

  return (
    <DashboardShell current="/dashboard" profile={profile}>
      <MarketView profile={profile} place={place} market={marketFor(profile.sector, profile.postcode, place)} />
    </DashboardShell>
  );
}
