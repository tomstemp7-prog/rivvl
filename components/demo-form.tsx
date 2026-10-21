"use client";

import { useState } from "react";
import { submitMessage } from "@/app/actions";
import { SECTORS } from "@/lib/sectors";

/** "Get in touch" demo requests: emailed to the owner through Formspree and saved as a contact message. */
const ENDPOINT = "https://formspree.io/f/xppqgrdo";
export const DEMO_EMAIL = "Tom.stemp7@gmail.com";

const input =
  "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-base font-medium text-ink aria-invalid:border-accent-dark";
const label = "flex min-w-0 flex-col gap-1.5 text-sm font-bold";
const optional = <span className="font-normal text-muted">(optional)</span>;

export function DemoForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const next: Record<string, string> = {};
    if (!get("name")) next.name = "Enter your name";
    if (!get("business")) next.business = "Enter your business name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) next.email = "Enter an email address, like you@yourbusiness.co.uk";
    setErrors(next);
    if (Object.keys(next).length) return;

    data.set("_subject", `Rivl demo request: ${get("business")}`);
    data.set("source", "demo");
    // Rivl's own copy, in the messages table, reads as one note.
    const saved = new FormData();
    saved.set("kind", "contact");
    saved.set("page", "/#demo");
    saved.set("name", get("name"));
    saved.set("email", get("email"));
    saved.set("_gotcha", get("_gotcha"));
    saved.set(
      "body",
      [`Demo request: ${get("business")} (${get("sector")})`, get("phone") && `Phone: ${get("phone")}`, get("message")].filter(Boolean).join("\n"),
    );

    setStatus("sending");
    // Email the owner and save a copy; either one succeeding counts.
    const [emailed, stored] = await Promise.allSettled([
      fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } }),
      submitMessage(saved),
    ]);
    const ok = (emailed.status === "fulfilled" && emailed.value.ok) || (stored.status === "fulfilled" && stored.value.ok);
    setStatus(ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div role="status" className="flex flex-col gap-1.5 rounded-2xl bg-data-tint px-6 py-5 text-data-dark">
        <p className="m-0 text-lg font-bold">Thanks, we’ll be in touch.</p>
        <p className="m-0 text-[15px]">We’ll email you within two working days to find a time for your demo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
        <label className={label}>
          Your name
          <input name="name" autoComplete="name" aria-invalid={!!errors.name} className={input} />
          {errors.name && <span className="text-sm font-semibold text-accent-dark">{errors.name}</span>}
        </label>
        <label className={label}>
          Business name
          <input name="business" autoComplete="organization" aria-invalid={!!errors.business} className={input} />
          {errors.business && <span className="text-sm font-semibold text-accent-dark">{errors.business}</span>}
        </label>
        <label className={label}>
          Email
          <input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} className={input} />
          {errors.email && <span className="text-sm font-semibold text-accent-dark">{errors.email}</span>}
        </label>
        <label className={label}>
          <span>Phone {optional}</span>
          <input name="phone" type="tel" autoComplete="tel" className={input} />
        </label>
        <label className={label}>
          Type of business
          <select name="sector" className={input} defaultValue="Gym">
            {SECTORS.map((s) => (
              <option key={s.label}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className={label}>
        <span>Anything we should know? {optional}</span>
        <textarea name="message" rows={3} placeholder="e.g. Best times to call, or what you’d like to see" className={`${input} py-3`} />
      </label>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-[52px] cursor-pointer rounded-[14px] bg-ink px-7 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Book a demo"}
        </button>
        {status === "error" ? (
          <p role="alert" className="m-0 text-sm font-semibold text-accent-dark">
            Couldn’t send that. Please email{" "}
            <a href={`mailto:${DEMO_EMAIL}`} className="underline">
              {DEMO_EMAIL}
            </a>
            .
          </p>
        ) : (
          <p className="m-0 text-sm text-muted">Usually 15 minutes, by video call or in person in Maidenhead.</p>
        )}
      </div>
    </form>
  );
}
