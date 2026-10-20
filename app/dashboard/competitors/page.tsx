import type { Metadata } from "next";
import Link from "next/link";
import { dashboardMain, DashboardShell } from "@/components/dashboard-shell";
import { LimitedBanner } from "@/components/limited-banner";
import { MOCK_UPDATED, radiusMiles, RIVALS, rivalName, SEGMENT_LABELS } from "@/lib/mock-market";
import { formatPrice, profileOrDemo, profileQuery } from "@/lib/profile";
import { itemsFor, pluralFor } from "@/lib/sectors";

export const metadata: Metadata = { title: "Competitors · Rivl" };

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = profileOrDemo(await searchParams);
  const query = profileQuery(profile);
  const limited = !profile.shared;
  const items = itemsFor(profile.sector);
  const plural = pluralFor(profile.sector);
  const max = radiusMiles(profile.radius);
  const rivals = [...RIVALS].sort((a, b) => a.miles - b.miles);
  const inside = rivals.filter((r) => r.miles <= max).length;

  return (
    <DashboardShell current="/dashboard/competitors" profile={profile}>
      <main className={dashboardMain}>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-sm font-semibold text-muted">
            {inside} of {rivals.length} {plural} within {profile.radius} of {profile.postcode} · updated {MOCK_UPDATED}
          </p>
          <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">Competitors</h1>
        </div>

        {limited && <LimitedBanner query={query} text="You’re seeing a limited view. Share your prices to see rivals by name." />}

        <div className="overflow-x-auto rounded-[22px] border border-line bg-surface py-2">
          <table className="w-full min-w-[820px] border-collapse text-[15px]">
            <caption className="sr-only">Every tracked {profile.sector.toLowerCase()} near you, nearest first, with their prices</caption>
            <thead>
              <tr className="text-right text-[13px] text-muted">
                <th className="px-6 py-3 text-left font-bold">Business</th>
                <th className="px-3 py-3 font-bold">Distance</th>
                {items.map((i) => (
                  <th key={i.id} className="px-3 py-3 font-bold last:pr-6">
                    {i.label.replace(" membership", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-right">
              {!limited && (
                <tr className="border-t border-sand bg-data-tint text-data-dark">
                  <th scope="row" className="px-6 py-3.5 text-left">
                    <span className="block font-bold">{profile.name} (you)</span>
                    <span className="text-[13px] font-normal">Your {profile.sector.toLowerCase()}</span>
                  </th>
                  <td className="px-3">—</td>
                  {items.map((i) => (
                    <td key={i.id} className="px-3 font-bold last:pr-6">
                      {profile.prices[i.id] !== undefined ? formatPrice(profile.prices[i.id]) : "—"}
                    </td>
                  ))}
                </tr>
              )}
              {rivals.map((r) => {
                const outside = r.miles > max;
                const note = !limited && r.note;
                return (
                  <tr key={r.id} className={`border-t border-sand hover:bg-paper ${outside ? "text-muted" : ""}`}>
                    <th scope="row" className="px-6 py-3.5 text-left font-normal">
                      <Link href={`/dashboard/competitors/${r.id}?${query}`} className="block font-bold text-ink hover:text-data-dark">
                        {rivalName(r, profile)}
                      </Link>
                      <span
                        className={`text-[13px] ${
                          note ? `font-semibold ${note.tone === "up" ? "text-accent-dark" : "text-data-dark"}` : "text-muted"
                        }`}
                      >
                        {note ? note.text : SEGMENT_LABELS[r.segment]}
                        {outside && " · outside your radius"}
                      </span>
                    </th>
                    <td className="px-3 whitespace-nowrap">{r.miles} mi</td>
                    {items.map((i) => (
                      <td key={i.id} className="px-3 last:pr-6">
                        {r.prices[i.id] !== undefined ? formatPrice(r.prices[i.id]) : <span aria-label="Not listed">–</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[13px] text-muted">Illustrative data. Select a business to see its price history.</p>
      </main>
    </DashboardShell>
  );
}
