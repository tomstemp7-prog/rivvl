"use client";

import { useState } from "react";
import { parsePrice } from "@/lib/profile";
import { itemsFor, SECTORS } from "@/lib/sectors";

/** Formspree form that receives waitlist sign-ups (emails the owner, keeps a list). */
const ENDPOINT = "https://formspree.io/f/xppqgrdo";

const input =
  "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-base font-medium text-ink aria-invalid:border-accent-dark";
const label = "flex min-w-0 flex-col gap-1.5 text-sm font-bold";
const optional = <span className="font-normal text-muted">(optional)</span>;
const error = "text-sm font-semibold text-accent-dark";

type Props = {
  /** Prefill from what the visitor already told us (e.g. the home page search). */
  initial?: { sector?: string; postcode?: string; business?: string };
  /** Where they joined from, so sign-ups can be told apart in Formspree. */
  source?: string;
  /** The visitor's town when it isn't launched yet, e.g. "Reading". */
  town?: string;
};

export function WaitlistForm({ initial = {}, source = "home", town }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sector, setSector] = useState(initial.sector ?? "Gym");
  const [price, setPrice] = useState("");
  const item = itemsFor(sector)[0];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Record<string, string> = {};
    if (!String(data.get("business") ?? "").trim()) next.business = "Enter your business name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email") ?? "").trim())) {
      next.email = "Enter an email address, like you@yourbusiness.co.uk";
    }
    const priceValue = price.trim() ? parsePrice(price) : null;
    if (price.trim() && priceValue === null) next.price = "Use a number, like 25 or £25.00";
    if (priceValue !== null && !data.get("price_consent")) next.price_consent = "Tick the box to share your price, or leave the price blank";
    setErrors(next);
    if (Object.keys(next).length) return;

    // Make the shared price readable in the Formspree inbox.
    data.delete("price");
    if (priceValue !== null) data.set("price", `£${priceValue.toFixed(2)} ${item.per} (${item.label})`);
    data.set("source", source);
    data.set("_subject", `Rivl interest: ${data.get("business")}${town ? ` in ${town}` : ""}`);

    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="flex flex-col gap-1.5 rounded-2xl bg-data-tint px-6 py-5 text-data-dark">
        <p className="m-0 text-lg font-bold">You’re on the list.</p>
        <p className="m-0 text-[15px]">
          We’ll email you when Rivl covers {town ?? "your area"}
          {price.trim() ? ", with your free local price report." : "."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
        <label className={label}>
          Business name
          <input name="business" autoComplete="organization" defaultValue={initial.business} aria-invalid={!!errors.business} className={input} />
          {errors.business && <span className={error}>{errors.business}</span>}
        </label>
        <label className={label}>
          <span>Your name {optional}</span>
          <input name="name" autoComplete="name" className={input} />
        </label>
        <label className={label}>
          Email
          <input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} className={input} />
          {errors.email && <span className={error}>{errors.email}</span>}
        </label>
        <label className={label}>
          <span>Phone {optional}</span>
          <input name="phone" type="tel" autoComplete="tel" className={input} />
        </label>
        <label className={label}>
          Type of business
          <select name="sector" className={input} value={sector} onChange={(e) => setSector(e.target.value)}>
            {SECTORS.map((s) => (
              <option key={s.label}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span>Postcode {optional}</span>
          <input name="postcode" autoComplete="postal-code" defaultValue={initial.postcode} className={input} />
        </label>
      </div>

      <fieldset className="m-0 flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 sm:p-5">
        <legend className="sr-only">Share a price (optional)</legend>
        <label className={label}>
          <span>
            Your {item.label.toLowerCase()} price {optional}
          </span>
          <span className="flex items-center gap-3">
            <input
              name="price"
              inputMode="decimal"
              placeholder="£0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={!!errors.price}
              aria-describedby="price-help"
              className={`${input} max-w-40`}
            />
            <span className="text-sm font-semibold text-muted">{item.per}</span>
          </span>
          {errors.price && <span className={error}>{errors.price}</span>}
        </label>
        <p id="price-help" className="m-0 text-sm leading-normal text-body">
          Share it and we’ll send you a free local price report when we launch near you. It’s only ever used in anonymised
          area averages, never shown against your name.
        </p>
        {price.trim() && (
          <label className="flex items-start gap-3 text-sm leading-normal text-body-strong">
            <input type="checkbox" name="price_consent" value="yes" aria-invalid={!!errors.price_consent} className="m-0 h-5 w-5 flex-none accent-ink" />
            I agree Rivl can use this price in anonymised area averages. It’s our current published price.
          </label>
        )}
        {errors.price_consent && <span className={error}>{errors.price_consent}</span>}
      </fieldset>

      {/* Spam trap: real people never see or fill this. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-[52px] cursor-pointer rounded-[14px] bg-ink px-7 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Register interest"}
        </button>
        <p aria-live="polite" className="m-0 text-sm text-muted">
          {status === "error" ? "Something went wrong. Please try again in a moment." : "No spam. We’ll email you when we launch near you."}
        </p>
      </div>
    </form>
  );
}
