"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitSignup } from "@/app/actions";
import { BUILD_MS, BuildingScreen, type Fact } from "@/components/building-screen";
import { parsePrice, profileQuery, type Profile } from "@/lib/profile";
import type { PriceItem } from "@/lib/sectors";

type CustomItem = { key: number; label: string; price: string };

const priceInput =
  "min-w-0 rounded-[10px] border-[1.5px] border-line-strong bg-white px-3.5 py-3 text-[17px] font-semibold text-ink aria-invalid:border-accent-dark";
const row = "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-4 border-t border-line px-4 py-4.5 sm:px-6";

export function PricesForm({ profile, items, facts, plural }: { profile: Profile; items: PriceItem[]; facts: Fact[]; plural: string }) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.id in profile.prices ? `£${profile.prices[i.id].toFixed(2)}` : ""])),
  );
  const [custom, setCustom] = useState<CustomItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const base = { name: profile.name, sector: profile.sector, postcode: profile.postcode, radius: profile.radius };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (anyInvalid || !anyEntered || !confirmed || !emailValid || saving) return;
    setSaving(true);
    setSaveError(null);
    // Custom items are saved, but only the standard items are benchmarked for now.
    const extras = custom.flatMap((c) => {
      const n = parsePrice(c.price);
      return c.label.trim() && n !== null ? [{ label: c.label.trim(), price: n }] : [];
    });
    // The building screen stays up for a few seconds even when saving is quicker; an error closes it at once.
    const minimum = new Promise((r) => setTimeout(r, BUILD_MS));
    const result = await submitSignup({ ...base, email: email.trim(), prices: parsed, extras });
    if ("error" in result) {
      setSaving(false);
      setSaveError(`${result.error} Please try again in a moment.`);
      return;
    }
    await minimum;
    // Saved: the dashboard link carries a private id. No database (e.g. local dev): keep the details in the link.
    router.push(`/dashboard?${result.id ? `site=${result.id}` : profileQuery({ ...base, shared: true, prices: parsed })}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {saving && (
        <BuildingScreen
          facts={facts}
          steps={[
            `Finding ${plural} within ${profile.radius} of ${profile.postcode}`,
            "Matching prices like for like",
            "Placing you against the area median",
            "Drawing your market map",
          ]}
        />
      )}
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
            <div className="flex min-w-0 flex-col gap-1">
              <input
                id={`p-${item.id}`}
                inputMode="decimal"
                placeholder="£0.00"
                className={priceInput}
                value={prices[item.id]}
                aria-invalid={invalid(prices[item.id])}
                aria-describedby={`per-${item.id}`}
                onChange={(e) => setPrices({ ...prices, [item.id]: e.target.value })}
                onBlur={() => {
                  const n = parsePrice(prices[item.id]);
                  if (n !== null) setPrices({ ...prices, [item.id]: `£${n.toFixed(2)}` });
                }}
              />
              <span id={`per-${item.id}`} className="text-[13px] font-semibold text-muted">
                {item.per}
              </span>
            </div>
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

      <label className="flex max-w-md flex-col gap-2 text-[15px] font-bold">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={submitted && !emailValid}
          aria-describedby="email-help"
          className="min-w-0 rounded-[10px] border-[1.5px] border-line-strong bg-white px-3.5 py-3 text-[17px] font-medium text-ink aria-invalid:border-accent-dark"
        />
        <span id="email-help" className="text-sm font-normal text-muted">
          For your monthly report. We never share it.
        </span>
      </label>

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

      {submitted && (anyInvalid || !anyEntered || needsConfirm || !emailValid || saveError) && (
        <p role="alert" className="m-0 rounded-xl bg-accent-tint px-4 py-3 text-[15px] font-semibold text-accent-dark">
          {anyInvalid
            ? "Check the highlighted prices: use numbers like 39 or £39.00."
            : !anyEntered
              ? "Enter at least one price, or skip for now to see a limited view."
              : !emailValid
                ? "Enter your email so we can send your monthly report."
                : needsConfirm
                  ? "Tick the box to confirm these are your current published prices."
                  : saveError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[54px] cursor-pointer items-center justify-center rounded-[14px] bg-ink px-8 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60"
        >
          {saving ? "Saving…" : "Show my local market"}
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
