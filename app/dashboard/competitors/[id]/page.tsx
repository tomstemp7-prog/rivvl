import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dashboardMain, DashboardShell } from "@/components/dashboard-shell";
import { LimitedBanner } from "@/components/limited-banner";
import { LineChart } from "@/components/line-chart";
import {
  addMonths,
  MOCK_MONTH,
  monthName,
  monthRange,
  priceAt,
  radiusMiles,
  rivalName,
  SEGMENT_LABELS,
  TRACKING_START,
} from "@/lib/mock-market";
import { marketFor } from "@/lib/markets";
import { placeFor } from "@/lib/postcode";
import { resolveProfile } from "@/lib/sites";
import { formatPrice, profileQuery } from "@/lib/profile";
import { itemsFor } from "@/lib/sectors";
import { CorrectionForm } from "@/components/message-forms";
import { WatchButton } from "./watch-button";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pill = "rounded-full bg-sand px-3 py-1.5 text-[13px] font-semibold";
const panel = "flex min-w-0 flex-col gap-4 rounded-[22px] border border-line bg-surface px-5 py-6 sm:px-7";

/** Finds the rival in the profile's own market (real businesses in launched towns, sample data elsewhere). */
async function load({ params, searchParams }: Props) {
  const profile = await resolveProfile(await searchParams);
  const place = await placeFor(profile.postcode);
  const market = await marketFor(profile.sector, profile.postcode, place);
  const id = (await params).id;
  return { profile, market, rival: market.rivals.find((r) => r.id === id) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { profile, market, rival } = await load(props);
  if (!rival) return { title: "Competitor · Rivl" };
  return { title: `${rivalName(rival, profile, false, market.rivals)} · Rivl` };
}

export default async function CompetitorPage(props: Props) {
  const { profile, market, rival } = await load(props);
  if (!rival) notFound();
  const query = profileQuery(profile);
  const limited = !profile.shared;
  const name = rivalName(rival, profile, false, market.rivals);
  const short = limited ? name : rival.short;

  const items = itemsFor(profile.sector).filter((i) => rival.prices[i.id] !== undefined);
  const chartItem = items[0];
  const yours = (id: string) => (limited ? null : (profile.prices[id] ?? null));
  const yourChartPrice = chartItem ? yours(chartItem.id) : null;

  // Sample rivals have a made-up 12-month history; real businesses' history starts when we first checked them.
  const months = monthRange(addMonths(MOCK_MONTH, -11), MOCK_MONTH);
  const showChart = !rival.real && !!chartItem;
  const rivalValues = showChart ? months.map((m) => priceAt(rival, chartItem.id, m)) : [];
  const chartChanges = showChart ? (rival.changes ?? []).filter((c) => c.itemId === chartItem.id && c.month >= months[0]) : [];
  const isNew = !rival.real && rival.firstSeen > TRACKING_START;

  const story = showChart
    ? [
        isNew && rival.firstSeen >= months[0]
          ? `${name} opened in ${monthName(rival.firstSeen)} at ${formatPrice(priceAt(rival, chartItem.id, rival.firstSeen)!)}`
          : `${name} charged ${formatPrice(rivalValues[0]!)} in ${monthName(months[0])}`,
        ...chartChanges.map((c) => `${c.to > c.from ? "rose" : "fell"} to ${formatPrice(c.to)} in ${monthName(c.month)}`),
      ].join(", then ")
    : "";
  const ariaLabel = `${story}${chartChanges.length ? "" : " and has held that price since"}.${
    yourChartPrice !== null ? ` Your price stayed at ${formatPrice(yourChartPrice)}.` : ""
  }`;

  const history = [
    ...(rival.changes ?? [])
      .slice()
      .sort((a, b) => b.month.localeCompare(a.month))
      .map((c) => {
        const label = items.find((i) => i.id === c.itemId)?.label ?? c.itemId;
        return {
          key: `${c.itemId}-${c.month}`,
          title: `${label} ${c.to > c.from ? "up" : "down"} ${formatPrice(Math.abs(c.to - c.from))}`,
          detail: `${formatPrice(c.from)} to ${formatPrice(c.to)} · ${monthName(c.month)}`,
          tone: "bg-accent",
        };
      }),
    {
      key: "first",
      title: isNew ? `Opened in your area` : rival.real ? "Rivl started tracking" : "First seen by Rivl",
      detail: monthName(rival.firstSeen),
      tone: isNew ? "bg-data" : "bg-[#C9C2B2]",
    },
  ];

  const checked = new Date(rival.checked).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const outside = rival.miles > radiusMiles(profile.radius);

  return (
    <DashboardShell current="/dashboard/competitors" profile={profile}>
      <main className={dashboardMain}>
        <Link href={`/dashboard?${query}`} className="self-start text-[15px] font-bold text-data-dark hover:text-ink">
          ← Back to market map
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="m-0 font-display text-[34px] leading-tight font-semibold tracking-[-1px] sm:text-[40px]">{name}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={pill}>{rival.miles} miles away</span>
              {outside && <span className={`${pill} bg-accent-tint text-accent-dark`}>Outside your {profile.radius} radius</span>}
              {rival.real ? (
                <>
                  {rival.real.address && !limited && <span className={pill}>{rival.real.address}</span>}
                  {rival.real.priceUrl && items.length > 0 && !limited ? (
                    <a href={rival.real.priceUrl} target="_blank" rel="noreferrer" className={`${pill} text-data-dark underline hover:text-ink`}>
                      Prices: {new URL(rival.real.priceUrl).hostname.replace(/^www\./, "")}
                    </a>
                  ) : (
                    <span className={pill}>{rival.real.priceNote ?? "Prices not collected yet"}</span>
                  )}
                  <span className={pill}>Checked {checked}</span>
                </>
              ) : (
                <>
                  {rival.segment && <span className={pill}>{SEGMENT_LABELS[rival.segment] ?? rival.segment}</span>}
                  <span className={pill}>Source: {rival.source === "owner" ? "confirmed by owner" : "public website"}</span>
                  <span className={pill}>Checked {checked}</span>
                </>
              )}
            </div>
          </div>
          <WatchButton />
        </div>

        {limited && <LimitedBanner query={query} text="You’re seeing a limited view. Share your prices to see who this is and how you compare." />}

        <div className="flex flex-wrap items-stretch gap-5">
          {!showChart && (
            <div className={`${panel} flex-[3_1_480px]`}>
              <h2 className="m-0 text-[17px] font-bold">Price history</h2>
              <p className="m-0 text-base leading-normal text-body">
                {items.length
                  ? `Rivl started tracking ${name}’s published prices on ${checked}. Any change will show here, and in your monthly report.`
                  : `${name} doesn’t publish its prices online${rival.real?.priceNote === "Price on request" ? "; you have to ask for a quote" : ""}. We’ll add them if that changes.`}
              </p>
              {rival.real?.caveat && <p className="m-0 text-[15px] text-muted">What the price covers: {rival.real.caveat}</p>}
              {rival.real?.website && !limited && (
                <a href={rival.real.website} target="_blank" rel="noreferrer" className="self-start text-[15px] font-bold text-data-dark hover:text-ink">
                  Visit their website ↗
                </a>
              )}
            </div>
          )}
          {showChart && (
            <div className={`${panel} flex-[3_1_480px]`}>
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="m-0 text-[17px] font-bold">
                  {chartItem.label} ({chartItem.per}), last 12 months
                </h2>
                <span className="text-[13px] text-muted">Illustrative</span>
              </div>
              <LineChart
                step
                height={280}
                ariaLabel={ariaLabel}
                points={months.map((m) => monthName(m))}
                axis={[0, 6, months.length - 1].map((i) => ({ index: i, label: monthName(months[i], "axis") }))}
                series={[
                  { name: short, color: "#FF6A3D", values: rivalValues, tag: `${short} ${formatPrice(rivalValues.at(-1)!)}` },
                  ...(yourChartPrice !== null
                    ? [{ name: "You", color: "#2E5BFF", values: months.map(() => yourChartPrice), dashed: true, tag: `You ${formatPrice(yourChartPrice)}`, tagText: "#FFFFFF" }]
                    : []),
                ]}
              />
            </div>
          )}

          <div className={`${panel} flex-[2_1_300px]`}>
            <h2 className="m-0 text-[17px] font-bold">Price changes</h2>
            <ol className="m-0 flex list-none flex-col gap-4.5 p-0">
              {history.map((h) => (
                <li key={h.key} className="flex gap-3.5">
                  <span className={`mt-1.25 h-3 w-3 flex-none rounded-full ${h.tone}`} />
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-[15px]">{h.title}</strong>
                    <span className="text-sm text-body">{h.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {items.length > 0 && (
          <div className="overflow-x-auto rounded-[22px] border border-line bg-surface py-2">
            <table className="w-full min-w-[560px] border-collapse text-base">
              <caption className="px-7 pt-4 pb-2 text-left text-[17px] font-bold">{limited ? "Their prices" : "Their prices vs yours"}</caption>
              <thead>
                <tr className="text-right text-[13px] text-muted">
                  <th className="px-7 py-3 text-left font-bold">Price item</th>
                  <th className="px-4 py-3 font-bold">{short}</th>
                  {!limited && <th className="px-4 py-3 font-bold text-data-dark">You</th>}
                  {!limited && <th className="px-7 py-3 font-bold">Difference</th>}
                </tr>
              </thead>
              <tbody className="text-right">
                {items.map((item) => {
                  const theirs = rival.prices[item.id];
                  const you = yours(item.id);
                  const diff = you === null ? null : Math.round((you - theirs) * 100) / 100;
                  return (
                    <tr key={item.id} className="border-t border-sand">
                      <th scope="row" className="px-7 py-4 text-left font-normal">
                        {item.label} <span className="text-sm text-muted">{item.per}</span>
                      </th>
                      <td className="p-4">{formatPrice(theirs)}</td>
                      {!limited && <td className="p-4 font-bold text-data-dark">{you === null ? "—" : formatPrice(you)}</td>}
                      {!limited && (
                        <td
                          className={`px-7 py-4 font-bold ${
                            diff === null || diff === 0 ? "text-muted" : diff < 0 ? "text-accent-dark" : "text-data-dark"
                          }`}
                        >
                          {diff === null ? (
                            <Link href={`/signup/prices?${query}`} className="text-data-dark hover:text-ink">Add your price</Link>
                          ) : diff === 0 ? (
                            "Same price"
                          ) : (
                            `You’re ${formatPrice(Math.abs(diff))} ${diff < 0 ? "lower" : "higher"}`
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rival.real && (
          <CorrectionForm
            businessId={rival.real.businessId}
            businessName={name}
            items={itemsFor(profile.sector).map((i) => ({ id: i.id, label: i.label }))}
            siteId={profile.id}
          />
        )}
        {rival.real && (
          <p className="m-0 text-[13px] text-muted">
            Business location: {rival.real.fromOsm && market.real ? market.attribution : "placed by its postcode"}.
          </p>
        )}
      </main>
    </DashboardShell>
  );
}
