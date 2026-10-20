"use client";

import Link from "next/link";
import { useState } from "react";
import { LineChart } from "@/components/line-chart";
import { formatPrice } from "@/lib/profile";

export type ReportData = {
  id: string;
  label: string;
  kind: string;
  scope: string;
  headline: string;
  stats: {
    changed: string;
    median: string;
    medianDelta: string | null;
    medianUp: boolean;
    opened: string;
    /** Null in the limited view, where we don't know your price. */
    position: string | null;
  };
  chart: { item: string; points: string[]; axis: { index: number; label: string }[]; median: (number | null)[]; you: number[] | null };
  events: { key: string; rivalId: string; title: string; detail: string }[];
  insights: string[];
};

const stat = "flex flex-col gap-1 rounded-2xl bg-paper p-4.5";
const statLabel = "text-[13px] font-semibold text-muted";
const statValue = "font-display text-[28px] font-semibold";
const button = "min-h-[46px] cursor-pointer rounded-xl border-[1.5px] border-ink px-4.5 text-[15px] font-bold";

export function ReportView({ reports, query }: { reports: ReportData[]; query: string }) {
  const [pickedId, setPickedId] = useState(reports[0].id);
  const [emailNote, setEmailNote] = useState(false);
  const r = reports.find((x) => x.id === pickedId) ?? reports[0];

  return (
    <main className="flex min-w-0 flex-[999_1_640px] flex-wrap items-start gap-7 px-4 pt-8 pb-14 sm:px-10">
      <nav aria-label="Reports" className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5 lg:max-w-[240px] print:hidden">
        <p className="eyebrow mb-2 text-[13px] text-muted">Reports</p>
        {reports.map((x) => {
          const on = x.id === r.id;
          return (
            <button
              key={x.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setPickedId(x.id);
                setEmailNote(false);
              }}
              className={`flex min-h-14 cursor-pointer flex-col gap-0.5 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-[15px] ${
                on ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-line-strong hover:bg-surface"
              }`}
            >
              <span className="font-bold">{x.label}</span>
              <span className="text-[13px] opacity-80">{x.kind}</span>
            </button>
          );
        })}
      </nav>

      <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-8 rounded-3xl border border-line bg-surface px-5 py-7 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-2">
            <p className="m-0 text-sm font-bold text-data-dark">
              {r.label} · {r.scope}
            </p>
            <h1 className="m-0 max-w-[620px] font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.8px] sm:text-[34px]">
              {r.headline}
            </h1>
          </div>
          <div className="flex flex-col gap-2 print:hidden">
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => window.print()} className={`${button} bg-surface text-ink hover:bg-paper`}>
                Download PDF
              </button>
              <button type="button" onClick={() => setEmailNote(true)} className={`${button} bg-ink text-paper hover:bg-ink-3`}>
                Email to me
              </button>
            </div>
            <p aria-live="polite" className="m-0 text-[13px] text-muted">
              {emailNote ? "Email delivery starts when accounts go live." : ""}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3.5">
          <div className={stat}>
            <span className={statLabel}>Rivals who changed price</span>
            <span className={statValue}>{r.stats.changed}</span>
          </div>
          <div className={stat}>
            <span className={statLabel}>Area median</span>
            <span className={statValue}>{r.stats.median}</span>
            {r.stats.medianDelta && (
              <span className={`text-[13px] font-bold ${r.stats.medianUp ? "text-accent-dark" : "text-data-dark"}`}>{r.stats.medianDelta}</span>
            )}
          </div>
          <div className={stat}>
            <span className={statLabel}>New in your area</span>
            <span className={statValue}>{r.stats.opened}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-data-tint p-4.5 text-data-dark">
            <span className="text-[13px] font-semibold">Your position</span>
            {r.stats.position ? (
              <span className={statValue}>{r.stats.position}</span>
            ) : (
              <Link href={`/signup/prices?${query}`} className="mt-1 text-[15px] font-bold hover:text-ink">
                Share your prices to see it
              </Link>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-3.5">
          <h2 className="m-0 text-lg font-bold">{r.chart.item} by quarter</h2>
          <LineChart
            key={r.id}
            height={240}
            ariaLabel={chartLabel(r)}
            points={r.chart.points}
            axis={r.chart.axis}
            series={[
              { name: "Area median", color: "#FF6A3D", values: r.chart.median },
              ...(r.chart.you ? [{ name: "You", color: "#2E5BFF", values: r.chart.you }] : []),
            ]}
          />
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="m-0 mb-2 text-lg font-bold">What changed</h2>
          {r.events.length === 0 && <p className="m-0 border-t border-sand py-4 text-body">No price changes or openings nearby in these three months.</p>}
          {r.events.map((e) => (
            <Link
              key={e.key}
              href={`/dashboard/competitors/${e.rivalId}?${query}`}
              className="flex flex-wrap justify-between gap-2 border-t border-sand py-4 text-ink hover:text-data-dark"
            >
              <span className="font-bold">{e.title}</span>
              <span className="text-body">{e.detail}</span>
            </Link>
          ))}
        </section>

        <section className="flex flex-col gap-2.5 rounded-[18px] bg-ink px-6 py-6 text-paper sm:px-7">
          <h2 className="m-0 text-lg font-bold">Worth considering</h2>
          <ul className="m-0 flex flex-col gap-2 pl-5 text-base leading-normal text-on-dark">
            {r.insights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

function chartLabel(r: ReportData) {
  const fmt = (n: number | null) => (n === null ? "no data" : formatPrice(n));
  const first = r.chart.median[0];
  const last = r.chart.median.at(-1) ?? null;
  const you = r.chart.you ? ` Your price stayed at ${fmt(r.chart.you[0])}.` : "";
  return `Area median went from ${fmt(first)} in ${r.chart.points[0]} to ${fmt(last)} in ${r.chart.points.at(-1)}.${you}`;
}
