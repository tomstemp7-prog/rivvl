import type { Metadata } from "next";
import Link from "next/link";
import { dashboardMain, DashboardShell } from "@/components/dashboard-shell";
import { hasPrices, marketFor } from "@/lib/markets";
import {
  addMonths,
  eventsBetween,
  medianAt,
  monthName,
  priceAt,
  quarterName,
  REPORTS,
  SAMPLE_PROFILE,
  rivalName,
  rivalsAt,
  type Report,
  type Rival,
} from "@/lib/mock-market";
import { areaLabel, placeFor, type Place } from "@/lib/postcode";
import { resolveProfile } from "@/lib/sites";
import { formatPrice, profileQuery, type Profile } from "@/lib/profile";
import { itemsFor, pluralFor } from "@/lib/sectors";
import { ReportView, type ReportData } from "./report-view";

export const metadata: Metadata = { title: "Reports · Rivl" };

const money = (n: number) => formatPrice(Math.round(Math.abs(n) * 100) / 100);

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Works out everything a report shows from the mock market history. */
function buildReport(report: Report, profile: Profile, place: Place | null, market: Rival[]): ReportData {
  const { radius, sector } = profile;
  const items = itemsFor(sector);
  const item = items[0];
  const you = profile.shared ? (profile.prices[item.id] ?? null) : null;
  const from = addMonths(report.to, -2);
  const before = addMonths(from, -1);

  const rivals = rivalsAt(radius, report.to, market);
  const events = eventsBetween(radius, from, report.to, market);
  const changes = events.filter((e) => e.kind === "change");
  const changed = new Set(changes.map((e) => e.rival.id)).size;
  const opened = events.filter((e) => e.kind === "opened").length;
  const ups = new Set(changes.filter((e) => e.change.to > e.change.from).map((e) => e.rival.id)).size;
  const cuts = changes.filter((e) => e.change.to < e.change.from).length;

  const med = medianAt(radius, item.id, report.to, you, market);
  const medBefore = medianAt(radius, item.id, before, you, market);
  const medDelta = med !== null && medBefore !== null ? med - medBefore : null;

  const prices = rivals.map((r) => priceAt(r, item.id, report.to)).filter((p): p is number => p !== null);
  const position = you !== null ? prices.filter((p) => p < you).length + 1 : null;

  // Five quarters, ending with the last complete quarter in the report.
  const [, m] = report.to.split("-").map(Number);
  const lastQuarter = addMonths(report.to, -(m % 3));
  const quarters = [-12, -9, -6, -3, 0].map((n) => addMonths(lastQuarter, n));

  const diffNow = you !== null && med !== null ? you - med : null;
  const yearAgo = medianAt(radius, item.id, addMonths(report.to, -12), you, market);
  const diffThen = you !== null && yearAgo !== null ? you - yearAgo : null;
  const side = (d: number) => (d === 0 ? "on the median" : `${money(d)} ${d < 0 ? "below" : "above"}`);

  const medianMove =
    medDelta === null || med === null
      ? "Not enough prices yet for an area median."
      : medDelta > 0
        ? `The local median rose to ${money(med)}.`
        : medDelta < 0
          ? `The local median fell to ${money(med)}.`
          : `The local median held at ${money(med)}.`;
  const youLine = diffNow === null ? "" : diffNow === 0 ? " You’re right on it." : ` You’re now ${money(diffNow)} ${diffNow < 0 ? "below" : "above"} it.`;

  const insights: string[] = [];
  if (diffNow !== null && diffThen !== null && diffNow !== diffThen) {
    insights.push(`A year ago you were ${side(diffThen)}${diffThen ? " the median" : ""}; you’re now ${side(diffNow)}${diffNow ? " it" : ""} without changing price.`);
  }
  insights.push(
    `${ups === 0 ? "No businesses" : ups === 1 ? "One business" : `${ups} businesses`} near you ${ups === 1 ? "has" : "have"} moved up since ${monthName(from, "short")}. ${
      cuts === 0 ? "None has cut prices in that time." : `${cuts} price ${cuts === 1 ? "cut" : "cuts"} in that time.`
    }`,
  );

  const unit = ` ${item.per} for ${item.label.toLowerCase()}`;

  return {
    id: report.id,
    label: report.label,
    kind: report.kind,
    scope: `${pluralFor(sector)[0].toUpperCase()}${pluralFor(sector).slice(1)} within ${radius} of ${areaLabel(profile.postcode, place)}`,
    headline: medianMove + youLine,
    stats: {
      changed: `${changed} of ${rivals.length}`,
      median: med === null ? "—" : money(med),
      medianDelta: medDelta ? `${medDelta > 0 ? "+" : "−"}${money(medDelta)} over 3 months` : medDelta === 0 ? "No change" : null,
      medianUp: (medDelta ?? 0) > 0,
      opened: `${opened} ${opened === 1 ? sector.toLowerCase() : pluralFor(sector)}`,
      position: position === null ? null : `${ordinal(position)} of ${prices.length + 1}`,
    },
    chart: {
      item: `${item.label} (${item.per})`,
      points: quarters.map((q) => quarterName(q).replace("’", "20")),
      axis: quarters.map((q, i) => ({ index: i, label: quarterName(q) })),
      median: quarters.map((q) => medianAt(radius, item.id, q, you, market)),
      you: you === null ? null : quarters.map(() => you),
    },
    events: events.map((e) => {
      const name = rivalName(e.rival, profile, false, market);
      if (e.kind === "opened") {
        const p = priceAt(e.rival, item.id, e.month);
        return {
          key: `${e.rival.id}-opened`,
          rivalId: e.rival.id,
          title: `${name} opened ${e.rival.miles} miles away`,
          detail: `${p !== null ? `${formatPrice(p)}${unit} · ` : ""}${monthName(e.month, "short")}`,
        };
      }
      const label = items.find((i) => i.id === e.change.itemId)?.label.toLowerCase() ?? e.change.itemId;
      return {
        key: `${e.rival.id}-${e.change.itemId}-${e.change.month}`,
        rivalId: e.rival.id,
        title: `${name} ${e.change.to > e.change.from ? "raised" : "cut"} its ${label}`,
        detail: `${formatPrice(e.change.from)} → ${formatPrice(e.change.to)} · ${monthName(e.change.month, "short")}`,
      };
    }),
    insights,
  };
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await resolveProfile(await searchParams);
  const place = await placeFor(profile.postcode);
  const market = await marketFor(profile.sector, profile.postcode, place);

  if (market.real) {
    // Reports compare months, so a real town needs a month of tracking before the first one.
    const started = new Date(market.fetched);
    const firstReport = new Date(Date.UTC(started.getUTCFullYear(), started.getUTCMonth() + 1, 1));
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const priced = market.rivals.filter(hasPrices).length;
    return (
      <DashboardShell current="/dashboard/reports" profile={profile}>
        <main className={dashboardMain}>
          <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">Reports</h1>
          <div className="flex max-w-[720px] flex-col gap-4 rounded-3xl border border-line bg-surface px-6 py-8 sm:px-10">
            <p className="m-0 text-sm font-bold text-data-dark">
              {market.town} · {pluralFor(profile.sector)} within {profile.radius} of {areaLabel(profile.postcode, place)}
            </p>
            <h2 className="m-0 font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.6px]">
              {priced ? `Your first ${market.town} report arrives on ${fmt(firstReport)}.` : `Reports start once we’re tracking prices near ${market.town}.`}
            </h2>
            <p className="m-0 text-[17px] leading-normal text-body">
              {priced
                ? `We started tracking real prices on ${fmt(started)}. Reports show what changed from one month to the next, so the first one needs a month of data. Right now we’re tracking published prices for ${priced} ${priced === 1 ? profile.sector.toLowerCase() : pluralFor(profile.sector)} within 10 miles of you.`
                : `We know the ${market.rivals.length} ${pluralFor(profile.sector)} within 10 miles of you, but haven’t collected their prices yet. Reports show what changed from one month to the next, so they start a month after we do.`}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/dashboard?${profileQuery(profile)}`} className="rounded-xl bg-ink px-5 py-3 font-bold text-paper hover:bg-ink-3">
                See today’s market
              </Link>
              <Link href={`/dashboard/reports?${profileQuery(SAMPLE_PROFILE)}`} className="rounded-xl border-[1.5px] border-ink px-5 py-3 font-bold text-ink hover:bg-paper">
                See a sample report
              </Link>
            </div>
          </div>
        </main>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell current="/dashboard/reports" profile={profile}>
      <ReportView reports={REPORTS.map((r) => buildReport(r, profile, place, market.rivals))} query={profileQuery(profile)} />
    </DashboardShell>
  );
}
