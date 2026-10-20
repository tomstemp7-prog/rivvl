import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { profileOrDemo } from "@/lib/profile";
import { MarketView } from "./market-view";

export const metadata: Metadata = { title: "Your local market · Rivl" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = profileOrDemo(await searchParams);

  return (
    <DashboardShell current="/dashboard" profile={profile}>
      <MarketView profile={profile} />
    </DashboardShell>
  );
}
