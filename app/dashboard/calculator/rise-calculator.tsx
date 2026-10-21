"use client";

import Link from "next/link";
import { useState } from "react";
import { CompareBar } from "@/components/compare-bar";
import { parsePrice } from "@/lib/profile";

/**
 * "What if I raise my price?": the extra takings from a rise, how many
 * customers the owner could lose before they're worse off, and where the new
 * price sits against the area. Takings only, not profit: costs aren't asked.
 */
export type CalcItem = {
  id: string;
  label: string;
  short: string;
  per: string;
  /** The owner's shared price, if any. */
  yours: number | null;
  /** Area prices for this item, sorted. */
  area: number[];
  median: number | null;
};

const input =
  "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] border-line-strong bg-white px-4 text-[17px] font-semibold text-ink aria-invalid:border-accent-dark";
const label = "flex min-w-0 flex-col gap-1.5 text-sm font-bold";
const card = "flex flex-col gap-2 rounded-[18px] border border-line bg-surface p-5.5";

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
const priceText = (n: number | null) => (n === null ? "" : `£${n.toFixed(2)}`);

export function RiseCalculator({ items, shared, pricesHref }: { items: CalcItem[]; shared: boolean; pricesHref: string }) {
  const first = items.find((i) => i.yours !== null) ?? items.find((i) => i.median !== null) ?? items[0];
  const [itemId, setItemId] = useState(first.id);
  const [price, setPrice] = useState(priceText(first.yours));
  const [customers, setCustomers] = useState("");
  const [rise, setRise] = useState("");
  const [lost, setLost] = useState(0);

  const item = items.find((i) => i.id === itemId)!;
  const monthly = item.per === "per month";
  const p = parsePrice(price);
  const n = Math.floor(Number(customers.replace(/[,\s]/g, "")));
  const r = parsePrice(rise);
  const nValid = customers.trim() !== "" && Number.isFinite(n) && n > 0 && n < 1_000_000;
  const ready = p !== null && p > 0 && nValid && r !== null && r > 0;

  function choose(id: string) {
    const next = items.find((i) => i.id === id)!;
    setItemId(id);
    setPrice(priceText(next.yours));
    setRise("");
    setLost(0);
  }

  const newPrice = ready ? p + r : null;
  const extra = ready ? n * r : 0;
  // Losing L customers leaves takings at (n - L) × new price; break even where that equals n × old price.
  const breakEven = ready ? (n * r) / (p + r) : 0;
  const canLose = Math.floor(breakEven + 1e-9);
  const lostClamped = ready ? Math.min(lost, n) : 0;
  const net = ready ? (n - lostClamped) * (p + r) - n * p : 0;

  const cheaper = newPrice === null ? 0 : item.area.filter((a) => a < newPrice).length;
  const dearer = newPrice === null ? 0 : item.area.filter((a) => a > newPrice).length;
  const vsMedian = newPrice !== null && item.median !== null ? newPrice - item.median : null;

  return (
    <div className="flex flex-col gap-6">
      {items.length > 1 && <CompareBar groups={[{ label: "Service", options: items.map((i) => ({ value: i.id, label: i.short })), value: itemId, onChange: choose }]} />}

      {!shared && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-data-tint px-5 py-4 text-data-dark">
          <p className="m-0 text-[15px] font-semibold">Share your prices and this fills in with your own figures, ready to try a rise.</p>
          <Link href={pricesHref} className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper hover:bg-ink-3">
            Share my prices
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <form onSubmit={(e) => e.preventDefault()} className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 rounded-[22px] border border-line bg-surface p-5.5 sm:p-7">
          <h2 className="m-0 text-lg font-bold">
            {item.label} <span className="text-sm font-semibold text-muted">{item.per}</span>
          </h2>
          <label className={label}>
            Your price now
            <input
              inputMode="decimal"
              placeholder="£0.00"
              value={price}
              aria-invalid={price.trim() !== "" && (p === null || p <= 0)}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={() => p !== null && setPrice(priceText(p))}
              className={input}
            />
          </label>
          <label className={label}>
            {monthly ? "Members paying this" : "How many you sell a month"}
            <input
              inputMode="numeric"
              placeholder={monthly ? "e.g. 400" : "e.g. 250"}
              value={customers}
              aria-invalid={customers.trim() !== "" && !nValid}
              onChange={(e) => {
                setCustomers(e.target.value);
                setLost(0);
              }}
              className={input}
            />
            <span className="text-[13px] font-normal text-muted">A rough figure is fine.</span>
          </label>
          <div className="flex flex-col gap-2">
            <label className={label}>
              Raise it by
              <input
                inputMode="decimal"
                placeholder="£0.00"
                value={rise}
                aria-invalid={rise.trim() !== "" && (r === null || r <= 0)}
                onChange={(e) => setRise(e.target.value)}
                onBlur={() => r !== null && setRise(priceText(r))}
                className={input}
              />
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick rises">
              {[
                ["+£1", () => 1],
                ["+£2", () => 2],
                ["+5%", () => (p ? Math.round(p * 5) / 100 : null)],
                ["+10%", () => (p ? Math.round(p * 10) / 100 : null)],
              ].map(([text, value]) => (
                <button
                  key={text as string}
                  type="button"
                  onClick={() => {
                    const v = (value as () => number | null)();
                    if (v) setRise(priceText(v));
                  }}
                  className="min-h-10 cursor-pointer rounded-full border-[1.5px] border-line-strong bg-white px-4 text-sm font-bold text-ink hover:border-ink"
                >
                  {text as string}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4" aria-live="polite">
          {ready && newPrice !== null ? (
            <>
              <div className="flex flex-col gap-2 rounded-[22px] bg-ink px-6 py-7 text-paper sm:px-8">
                <p className="eyebrow m-0 text-[13px] text-accent">If nobody leaves</p>
                <p className="m-0 font-display text-[32px] leading-none font-semibold sm:text-[40px]">+{gbp(extra)} a month</p>
                <p className="m-0 text-base text-on-dark-2">
                  {gbp(extra * 12)} a year, at {gbp(newPrice)} {item.per}.
                </p>
              </div>

              <div className={card}>
                <p className="m-0 text-[13px] font-bold text-muted">Customers you could lose and still break even</p>
                {canLose >= 1 ? (
                  <>
                    <p className="m-0 font-display text-[34px] leading-tight font-semibold">
                      {canLose.toLocaleString("en-GB")} of {n.toLocaleString("en-GB")}{" "}
                      <span className="text-xl text-muted">({((breakEven / n) * 100).toFixed(1)}%)</span>
                    </p>
                    <p className="m-0 text-[15px] leading-normal text-body">
                      Lose fewer than that and you take more than now. Lose more and the rise costs you.
                    </p>
                  </>
                ) : (
                  <p className="m-0 text-[17px] leading-normal font-semibold text-accent-dark">
                    Losing even one {monthly ? "member" : "sale"} a month would cost more than this rise brings in.
                  </p>
                )}
              </div>

              <div className={card}>
                <label htmlFor="lost" className="text-[13px] font-bold text-muted">
                  Try it: if you lost {lostClamped.toLocaleString("en-GB")} {monthly ? (lostClamped === 1 ? "member" : "members") : lostClamped === 1 ? "sale" : "sales"} a month
                </label>
                <input
                  id="lost"
                  type="range"
                  min={0}
                  max={Math.max(1, Math.min(n, Math.ceil(breakEven * 2) + 2))}
                  value={lostClamped}
                  onChange={(e) => setLost(Number(e.target.value))}
                  className="w-full accent-ink"
                />
                <p className={`m-0 font-display text-2xl font-semibold ${net > 0.005 ? "text-data-dark" : net < -0.005 ? "text-accent-dark" : "text-ink"}`}>
                  {Math.abs(net) < 0.005 ? "Same takings as now" : `${net > 0 ? "+" : "−"}${gbp(Math.abs(net))} a month vs now`}
                </p>
              </div>

              {item.area.length > 0 && (
                <div className={card}>
                  <p className="m-0 text-[13px] font-bold text-muted">Where {gbp(newPrice)} sits locally</p>
                  <p className="m-0 text-[17px] leading-normal font-semibold">
                    {dearer === 0
                      ? `It would be the highest of ${item.area.length} local prices.`
                      : cheaper === 0
                        ? `It would still be the lowest of ${item.area.length} local prices.`
                        : `Higher than ${cheaper} and lower than ${dearer} of ${item.area.length} local prices.`}
                  </p>
                  {vsMedian !== null && (
                    <p className="m-0 text-[15px] text-body">
                      {Math.abs(vsMedian) < 0.005 ? "Right on" : `${gbp(Math.abs(vsMedian))} ${vsMedian > 0 ? "above" : "below"}`} the area median of {gbp(item.median!)}.
                    </p>
                  )}
                </div>
              )}
              <p className="m-0 text-[13px] leading-normal text-muted">This compares takings, not profit. If each customer costs you something to serve, losing a few hurts a little less than shown.</p>
            </>
          ) : (
            <div className={`${card} justify-center`}>
              <p className="m-0 text-[17px] font-bold">Fill in the three boxes</p>
              <p className="m-0 text-[15px] leading-normal text-body">
                Your price, roughly how many {monthly ? "members pay it" : "you sell a month"}, and the rise you’re thinking about. The answer updates as you type.
              </p>
              {item.median !== null && <p className="m-0 text-[15px] text-body">Area median for this: {gbp(item.median)} {item.per}.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
