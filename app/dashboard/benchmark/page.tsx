import type { Metadata } from "next";
import Link from "next/link";
import { dashboardMain, DashboardShell } from "@/components/dashboard-shell";
import { hasPrices, marketFor } from "@/lib/markets";
import { median, MOCK_TODAY, rivalsWithin } from "@/lib/mock-market";
import { areaLabel, placeFor } from "@/lib/postcode";
import { pooledPrices, resolveProfile } from "@/lib/sites";
import { formatPrice, profileQuery } from "@/lib/profile";
import { itemsFor, pluralFor } from "@/lib/sectors";

export const metadata: Metadata = { title: "Benchmark · Rivl" };

const card = "flex flex-col gap-2 rounded-[18px] border border-line bg-surface p-5.5";
const money = (n: number) => formatPrice(Math.round(n * 100) / 100);
const pos = (v: number, lo: number, hi: number) => `${hi === lo ? 50 : (((v - lo) / (hi - lo)) * 100).toFixed(1)}%`;

const DAY = 24 * 60 * 60 * 1000;

export default async function BenchmarkPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await resolveProfile(await searchParams);
  const query = profileQuery(profile);
  const place = await placeFor(profile.postcode);
  const limited = !profile.shared;
  const market = marketFor(profile.sector, profile.postcode, place);
  const rivals = rivalsWithin(profile.radius, market.rivals);
  // Owner-shared prices join the low/median/high only once enough exist nearby (lib/sites.ts).
  const pooled = profile.shared ? ((await pooledPrices(profile.sector, place, profile.id))[profile.radius] ?? {}) : {};
  const plural = pluralFor(profile.sector);

  const rows = itemsFor(profile.sector)
    .map((item) => {
      const you = limited ? null : (profile.prices[item.id] ?? null);
      const values = [...rivals.map((r) => r.prices[item.id]).filter((p) => p !== undefined), ...(pooled[item.id] ?? [])];
      // An item needs at least one rival's price to benchmark against.
      if (!values.length) return null;
      if (you !== null) values.push(you);
      const med = median(values)!;
      return { ...item, you, low: Math.min(...values), high: Math.max(...values), med, diff: you === null ? null : you - med };
    })
    .filter((r) => r !== null);

  const compared = rows.filter((r) => r.diff !== null);
  const below = compared.filter((r) => r.diff! < 0).length;
  const at = compared.filter((r) => r.diff === 0).length;
  const above = compared.filter((r) => r.diff! > 0).length;
  const biggest = [...compared].sort((a, b) => Math.abs(b.diff!) - Math.abs(a.diff!))[0];

  const clauses = [
    [below, "below the area median", "below it"],
    [at, "at the area median", "at it"],
    [above, "above the area median", "above it"],
  ] as const;
  const present = clauses.filter(([n]) => n > 0);
  const parts = present.map(([n, full, short], i) => {
    if (i > 0) return `${short} on ${present.length === 2 && n === 1 ? "the other" : n}`;
    return n === compared.length ? `${full} on all ${n} items` : `${full} on ${n} of ${compared.length} items`;
  });
  const summary = parts.length ? `You’re ${parts.slice(0, -1).join(", ")}${parts.length > 1 ? " and " : ""}${parts.at(-1)}.` : null;

  const recent = rivals.filter((r) => (Date.parse(MOCK_TODAY) - Date.parse(r.checked)) / DAY <= 30).length;
  const owner = rivals.filter((r) => r.source === "owner").length;

  return (
    <DashboardShell current="/dashboard/benchmark" profile={profile}>
      <main className={dashboardMain}>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-sm font-semibold text-muted">
            {rivals.length} {plural} within {profile.radius} of {areaLabel(profile.postcode, place)} ·{" "}
            {market.real ? `real ${market.town} prices` : "illustrative data"}
          </p>
          <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">Where you sit</h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] bg-ink px-6 py-7 text-paper sm:px-8">
          <div className="flex max-w-[640px] flex-col gap-2">
            <p className="eyebrow text-[13px] text-accent">Summary</p>
            {summary ? (
              <>
                <p className="m-0 font-display text-2xl leading-[1.25] font-semibold sm:text-[28px]">{summary}</p>
                {biggest && biggest.diff !== 0 && (
                  <p className="m-0 text-base leading-normal text-on-dark-2">
                    Your biggest gap is {biggest.label.toLowerCase()}, where you sit {money(Math.abs(biggest.diff!))}{" "}
                    {biggest.diff! < 0 ? "under" : "over"} the median.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="m-0 font-display text-2xl leading-[1.25] font-semibold sm:text-[28px]">
                  {rows.length ? "Share your prices to see where you sit on each item." : `We haven’t collected ${plural} prices near you yet.`}
                </p>
                <p className="m-0 text-base leading-normal text-on-dark-2">
                  {rows.length
                    ? "Until then you’ll see the area low, median and high for every item."
                    : `You can already see the ${rivals.length} ${plural} near you. Prices are coming soon.`}
                </p>
              </>
            )}
          </div>
          <Link
            href={summary ? `/dashboard/${market.real ? "competitors" : "reports"}?${query}` : rows.length ? `/signup/prices?${query}` : `/dashboard/competitors?${query}`}
            className="flex min-h-12 items-center rounded-xl bg-accent px-5.5 font-bold text-ink hover:brightness-95"
          >
            {summary ? (market.real ? "See all competitors" : "Open latest report") : rows.length ? "Share my prices" : "See who’s near you"}
          </Link>
        </div>

        <div className="rounded-[22px] border border-line bg-surface px-5 py-2 sm:px-7">
          <div className="flex flex-wrap items-center gap-5 py-4 text-[13px] font-semibold text-body">
            {!limited && (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-data" />
                You
              </span>
            )}
            <span className="flex items-center gap-2">
              <span className="h-4 w-[3px] bg-ink" />
              Area median
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-7 rounded bg-line" />
              Area low to high
            </span>
          </div>

          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-sand py-5.5">
              <div className="order-1 flex min-w-0 flex-[1_1_180px] flex-col gap-1">
                <span className="text-[17px] font-bold">
                  {r.label} <span className="text-sm font-semibold text-muted">{r.per}</span>
                </span>
                {r.diff === null ? (
                  <span className="text-sm font-semibold text-muted">{limited ? r.detail : "You haven’t shared this price"}</span>
                ) : (
                  <span className={`text-sm font-bold ${r.diff < 0 ? "text-accent-dark" : "text-data-dark"}`}>
                    {r.diff === 0 ? "At the median" : `${money(Math.abs(r.diff))} ${r.diff < 0 ? "below" : "above"} median`}
                  </span>
                )}
              </div>
              <div className="order-3 flex min-w-0 basis-full flex-col gap-2 lg:order-2 lg:flex-[3_1_300px]">
                <div
                  className="relative mx-2.5 h-7"
                  role="img"
                  aria-label={`${r.label}: low ${money(r.low)}, median ${money(r.med)}, high ${money(r.high)}${r.you !== null ? `, you ${money(r.you)}` : ""}`}
                >
                  <div className="absolute inset-x-[-10px] top-2.5 h-2 rounded bg-line" />
                  <div className="absolute top-1 h-5 w-[3px] -translate-x-1/2 bg-ink" style={{ left: pos(r.med, r.low, r.high) }} />
                  {r.you !== null && (
                    <div
                      className="absolute top-1 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-surface bg-data"
                      style={{ left: pos(r.you, r.low, r.high) }}
                    />
                  )}
                </div>
                <div className="flex justify-between gap-2 text-[13px] text-muted">
                  <span>Low {money(r.low)}</span>
                  <span>Median {money(r.med)}</span>
                  <span>High {money(r.high)}</span>
                </div>
              </div>
              <div className="order-2 flex flex-none flex-col gap-0.5 text-right lg:order-3 lg:w-24">
                <span className="text-xs font-semibold text-muted">You</span>
                {r.you !== null ? (
                  <span className="font-display text-[26px] font-semibold text-data-dark">{money(r.you)}</span>
                ) : (
                  <Link href={`/signup/prices?${query}`} className="text-sm font-bold text-data-dark hover:text-ink">
                    Add price
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
          <div className={card}>
            <h2 className="m-0 text-base font-bold">How we compare like for like</h2>
            <p className="m-0 text-[15px] leading-normal text-body">
              Each rival’s price is matched to a standard item, such as a {itemsFor(profile.sector)[0].label.toLowerCase()} (
              {itemsFor(profile.sector)[0].detail.toLowerCase()}), and compared on how customers pay for it.
            </p>
          </div>
          <div className={card}>
            <h2 className="m-0 text-base font-bold">Data freshness</h2>
            <p className="m-0 text-[15px] leading-normal text-body">
              {market.real
                ? `${rivals.filter(hasPrices).length} of ${rivals.length} ${plural} near you publish prices online. Each one is taken from the business’s own website or booking page, with the source and date on its page.`
                : `${recent} of ${rivals.length} rivals’ prices checked in the last 30 days. ${owner} confirmed by the owner.`}
            </p>
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}
