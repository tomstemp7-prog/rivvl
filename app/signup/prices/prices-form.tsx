"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parsePrice, profileQuery, type Profile } from "@/lib/profile";

type Item = { id: string; label: string; detail: string };
type CustomItem = { key: number; label: string; price: string };

const priceInput =
  "min-w-0 rounded-[10px] border-[1.5px] border-line-strong bg-white px-3.5 py-3 text-[17px] font-semibold text-ink aria-invalid:border-accent-dark";
const row = "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-4 border-t border-line px-4 py-4.5 sm:px-6";

export function PricesForm({ profile, items }: { profile: Profile; items: Item[] }) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.id in profile.prices ? `£${profile.prices[i.id].toFixed(2)}` : ""])),
  );
  const [custom, setCustom] = useState<CustomItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const invalid = (raw: string) => raw.trim() !== "" && parsePrice(raw) === null;
  const parsed = Object.fromEntries(
    items.flatMap((i) => {
      const n = parsePrice(prices[i.id]);
      return n === null ? [] : [[i.id, n]];
    }),
  );
  const anyEntered = Object.keys(parsed).length > 0 || custom.some((c) => parsePrice(c.price) !== null);
  const anyInvalid = items.some((i) => invalid(prices[i.id])) || custom.some((c) => invalid(c.price));
  const needsConfirm = submitted && anyEntered && !confirmed;

  const base = { name: profile.name, sector: profile.sector, postcode: profile.postcode, radius: profile.radius };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (anyInvalid || !anyEntered || !confirmed) return;
    // Custom items aren't benchmarked yet, so only the standard items go to the dashboard.
    router.push(`/dashboard?${profileQuery({ ...base, shared: true, prices: parsed })}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <div role="group" aria-label="How to add prices" className="flex flex-wrap gap-2.5">
        <button
          type="button"
          aria-pressed="true"
          className="min-h-[46px] rounded-xl border-[1.5px] border-ink bg-ink px-4.5 text-[15px] font-bold text-paper"
        >
          Enter manually
        </button>
        <button
          type="button"
          disabled
          className="min-h-[46px] cursor-not-allowed rounded-xl border-[1.5px] border-line-strong bg-surface px-4.5 text-[15px] font-semibold text-ink opacity-80"
        >
          Connect booking system · coming soon
        </button>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 bg-sand px-4 py-3.5 text-[13px] font-bold tracking-[1px] text-body uppercase sm:px-6">
          <span>Price item</span>
          <span>Your price</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className={row}>
            <div className="flex flex-col gap-0.5">
              <label htmlFor={`p-${item.id}`} className="text-base font-bold">
                {item.label}
              </label>
              <span className="text-sm text-muted">{item.detail}</span>
            </div>
            <input
              id={`p-${item.id}`}
              inputMode="decimal"
              placeholder="£0.00"
              className={priceInput}
              value={prices[item.id]}
              aria-invalid={invalid(prices[item.id])}
              onChange={(e) => setPrices({ ...prices, [item.id]: e.target.value })}
              onBlur={() => {
                const n = parsePrice(prices[item.id]);
                if (n !== null) setPrices({ ...prices, [item.id]: `£${n.toFixed(2)}` });
              }}
            />
          </div>
        ))}
        {custom.map((c, idx) => (
          <div key={c.key} className={row}>
            <div className="flex items-center gap-2">
              <input
                aria-label={`Custom item ${idx + 1} name`}
                placeholder="Item name"
                className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-line-strong bg-white px-3.5 py-3 text-base font-bold"
                value={c.label}
                onChange={(e) => setCustom(custom.map((x) => (x.key === c.key ? { ...x, label: e.target.value } : x)))}
              />
              <button
                type="button"
                aria-label={`Remove custom item ${idx + 1}`}
                onClick={() => setCustom(custom.filter((x) => x.key !== c.key))}
                className="h-11 w-11 flex-none cursor-pointer rounded-[10px] text-xl text-muted hover:bg-sand hover:text-ink"
              >
                ×
              </button>
            </div>
            <input
              aria-label={`Custom item ${idx + 1} price`}
              inputMode="decimal"
              placeholder="£0.00"
              className={priceInput}
              value={c.price}
              aria-invalid={invalid(c.price)}
              onChange={(e) => setCustom(custom.map((x) => (x.key === c.key ? { ...x, price: e.target.value } : x)))}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCustom([...custom, { key: Date.now(), label: "", price: "" }])}
        className="cursor-pointer self-start text-base font-bold text-data-dark underline hover:text-ink"
      >
        + Add another price item
      </button>

      <label className="flex items-start gap-3 text-[15px] leading-normal text-body-strong">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="m-0 h-5.5 w-5.5 flex-none accent-ink"
          aria-invalid={needsConfirm}
        />
        I confirm these are our current published prices. I understand Rivl only uses shared prices in anonymised area
        averages.
      </label>

      {submitted && (anyInvalid || !anyEntered || needsConfirm) && (
        <p role="alert" className="m-0 rounded-xl bg-accent-tint px-4 py-3 text-[15px] font-semibold text-accent-dark">
          {anyInvalid
            ? "Check the highlighted prices: use numbers like 39 or £39.00."
            : !anyEntered
              ? "Enter at least one price, or skip for now to see a limited view."
              : "Tick the box to confirm these are your current published prices."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="flex min-h-[54px] cursor-pointer items-center justify-center rounded-[14px] bg-ink px-8 text-base font-bold text-paper hover:bg-ink-3"
        >
          Show my local market
        </button>
        <Link href={`/dashboard?${profileQuery({ ...base, shared: false })}`} className="text-base font-semibold text-body underline hover:text-ink">
          Skip for now (limited view)
        </Link>
        <Link href={`/signup?${profileQuery(base)}`} className="text-base font-semibold text-body underline hover:text-ink">
          Back
        </Link>
      </div>
    </form>
  );
}
