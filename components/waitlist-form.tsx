"use client";

import { useState } from "react";
import { SECTORS } from "@/lib/sectors";

/** Formspree form that receives waitlist sign-ups (emails the owner, keeps a list). */
const ENDPOINT = "https://formspree.io/f/xppqgrdo";

const input =
  "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-base font-medium text-ink aria-invalid:border-accent-dark";
const label = "flex min-w-0 flex-col gap-1.5 text-sm font-bold";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter an email address, like you@yourbusiness.co.uk");
      return;
    }
    setEmailError(null);
    if (!ENDPOINT) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      setStatus(res.ok ? "done" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="flex flex-col gap-1.5 rounded-2xl bg-data-tint px-6 py-5 text-data-dark">
        <p className="m-0 text-lg font-bold">You’re on the list.</p>
        <p className="m-0 text-[15px]">We’ll email you when Rivl covers your area.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
        <label className={label}>
          Email
          <input name="email" type="email" autoComplete="email" required aria-invalid={!!emailError} className={input} />
          {emailError && <span className="text-sm font-semibold text-accent-dark">{emailError}</span>}
        </label>
        <label className={label}>
          <span>
            Business name <span className="font-normal text-muted">(optional)</span>
          </span>
          <input name="business" autoComplete="organization" className={input} />
        </label>
        <label className={label}>
          Type of business
          <select name="sector" className={input} defaultValue="Gym">
            {SECTORS.map((s) => (
              <option key={s.label}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span>
            Postcode <span className="font-normal text-muted">(optional)</span>
          </span>
          <input name="postcode" autoComplete="postal-code" className={input} />
        </label>
      </div>
      {/* Spam trap: real people never see or fill this. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-[52px] cursor-pointer rounded-[14px] bg-ink px-7 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60"
        >
          {status === "sending" ? "Joining…" : "Join the waitlist"}
        </button>
        <p aria-live="polite" className="m-0 text-sm text-muted">
          {status === "error" ? "Something went wrong. Please try again in a moment." : "No spam. One email when we launch near you."}
        </p>
      </div>
    </form>
  );
}
