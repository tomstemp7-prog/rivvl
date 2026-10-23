import type { Metadata } from "next";
import { dashboardMain, DashboardShell } from "@/components/dashboard-shell";
import { marketFor } from "@/lib/markets";
import { median, rivalsWithin } from "@/lib/mock-market";
import { areaLabel, placeFor } from "@/lib/postcode";
import { profileQuery } from "@/lib/profile";
import { pooledPrices, resolveProfile } from "@/lib/sites";
import { itemsFor, pluralFor } from "@/lib/sectors";
import { RiseCalculator, type CalcItem } from "./rise-calculator";

export const metadata: Metadata = { title: "Price rise calculator · Rivl" };

export default async function CalculatorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await resolveProfile(await searchParams);
  const place = await placeFor(profile.postcode);
  const market = await marketFor(profile.sector, profile.postcode, place);
  const rivals = rivalsWithin(profile.radius, market.rivals);
  const pooled = profile.shared && market.real ? ((await pooledPrices(profile.sector, place, profile.id))[profile.radius] ?? {}) : {};

  // Each item with the owner's price (when shared) and the area's prices to place a new price against.
  const items = itemsFor(profile.sector).map((item): CalcItem => {
    const area = [...rivals.map((r) => r.prices[item.id]).filter((p) => p !== undefined), ...(pooled[item.id] ?? [])].sort((a, b) => a - b);
    return { id: item.id, label: item.label, short: item.short, per: item.per, yours: profile.shared ? (profile.prices[item.id] ?? null) : null, area, median: median(area) };
  });

  return (
    <DashboardShell current="/dashboard/calculator" profile={profile}>
      <main className={dashboardMain}>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-sm font-semibold text-muted">
            Against {pluralFor(profile.sector)} within {profile.radius} of {areaLabel(profile.postcode, place)} · {market.real ? `real ${market.town} ${items.some((i) => i.area.length) ? "prices" : "businesses"}` : "illustrative data"}
          </p>
          <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">What if I raise my price?</h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-normal text-body">
            See what a rise would bring in, how many customers you could lose before you’re worse off, and where the new price sits locally.
          </p>
        </div>
        <RiseCalculator items={items} shared={!!profile.shared} pricesHref={`/${profile.owned ? "dashboard" : "signup"}/prices?${profileQuery(profile)}`} />
      </main>
    </DashboardShell>
  );
}
