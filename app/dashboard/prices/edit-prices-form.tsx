"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveMyPrices } from "@/app/auth-actions";
import { parsePrice } from "@/lib/profile";
import type { PriceItem } from "@/lib/sectors";

const priceInput =
  "min-w-0 rounded-[10px] border-[1.5px] border-line-strong bg-white px-3.5 py-3 text-[17px] font-semibold text-ink aria-invalid:border-accent-dark";

type Props = { items: PriceItem[]; prices: Record<string, number>; radius: string; radii: string[] };

export function EditPricesForm({ items, prices, radius: initialRadius, radii }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.id in prices ? `£${prices[i.id].toFixed(2)}` : ""])),
  );
  const [radius, setRadius] = useState(initialRadius);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const invalid = (raw: string) => raw.trim() !== "" && parsePrice(raw) === null;
  const anyInvalid = items.some((i) => invalid(values[i.id]));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (anyInvalid) {
      setError("Check the highlighted prices: use numbers like 39 or £39.00.");
      return;
    }
    setStatus("saving");
    setError(null);
    const parsed = Object.fromEntries(items.flatMap((i) => (parsePrice(values[i.id]) === null ? [] : [[i.id, parsePrice(values[i.id])!]])));
    const result = await saveMyPrices({ radius, prices: parsed });
    if ("error" in result) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-[860px] flex-col gap-6">
      <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-4 px-4 py-4.5 sm:px-6 ${idx ? "border-t border-line" : ""}`}
          >
            <div className="flex flex-col gap-0.5">
              <label htmlFor={`edit-${item.id}`} className="text-base font-bold">
                {item.label}
              </label>
              <span className="text-sm text-muted">{item.detail}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <input
                id={`edit-${item.id}`}
                inputMode="decimal"
                placeholder="Not shared"
                className={priceInput}
                value={values[item.id]}
                aria-invalid={invalid(values[item.id])}
                aria-describedby={`edit-per-${item.id}`}
                onChange={(e) => {
                  setValues({ ...values, [item.id]: e.target.value });
                  setStatus("idle");
                }}
                onBlur={() => {
                  const n = parsePrice(values[item.id]);
                  if (n !== null) setValues({ ...values, [item.id]: `£${n.toFixed(2)}` });
                }}
              />
              <span id={`edit-per-${item.id}`} className="text-[13px] font-semibold text-muted">
                {item.per}
              </span>
            </div>
          </div>
        ))}
      </div>

      <label className="flex max-w-xs flex-col gap-1.5 text-[15px] font-bold">
        How far your customers travel
        <select value={radius} onChange={(e) => setRadius(e.target.value)} className={priceInput}>
          {radii.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>

      <p className="m-0 text-sm text-muted">Leave a price blank to stop sharing it.</p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="min-h-[54px] cursor-pointer rounded-[14px] bg-ink px-8 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save prices"}
        </button>
        <p aria-live="polite" className={`m-0 text-[15px] font-semibold ${error ? "text-accent-dark" : "text-data-dark"}`}>
          {error ?? (status === "saved" ? "Saved. Your benchmark now uses these prices." : "")}
        </p>
      </div>
    </form>
  );
}
