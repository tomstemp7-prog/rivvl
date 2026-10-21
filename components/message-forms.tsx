"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { submitMessage } from "@/app/actions";

/*
 * Forms that send a message to Rivl (stored in the messages table):
 * the contact form, the dashboard feedback button and "correct this price".
 */

const input =
  "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-base font-medium text-ink aria-invalid:border-accent-dark";
const label = "flex min-w-0 flex-col gap-1.5 text-sm font-bold";
const optional = <span className="font-normal text-muted">(optional)</span>;
const submit =
  "min-h-12 cursor-pointer rounded-xl bg-ink px-6 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60";
const trap = <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />;

type Status = "idle" | "sending" | "done" | "error";

async function send(form: HTMLFormElement, extra: Record<string, string>) {
  const data = new FormData(form);
  for (const [k, v] of Object.entries(extra)) data.set(k, v);
  try {
    return (await submitMessage(data)).ok;
  } catch {
    return false;
  }
}

function Thanks({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="flex flex-col gap-1.5 rounded-2xl bg-data-tint px-5 py-4 text-data-dark">
      <p className="m-0 text-base font-bold">{title}</p>
      <p className="m-0 text-[15px]">{text}</p>
    </div>
  );
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email") ?? "").trim())) next.email = "Enter your email so we can reply";
    if (!String(data.get("body") ?? "").trim()) next.body = "Write a message";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStatus("sending");
    setStatus((await send(e.currentTarget, { kind: "contact", page: "/contact" })) ? "done" : "error");
  }

  if (status === "done") return <Thanks title="Message sent." text="Thanks. We’ll reply by email, usually within two working days." />;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
        <label className={label}>
          <span>Your name {optional}</span>
          <input name="name" autoComplete="name" className={input} />
        </label>
        <label className={label}>
          Email
          <input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} className={input} />
          {errors.email && <span className="text-sm font-semibold text-accent-dark">{errors.email}</span>}
        </label>
      </div>
      <label className={label}>
        Message
        <textarea name="body" rows={6} aria-invalid={!!errors.body} className={`${input} py-3`} />
        {errors.body && <span className="text-sm font-semibold text-accent-dark">{errors.body}</span>}
      </label>
      {trap}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className={submit}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "error" && <p className="m-0 text-sm font-semibold text-accent-dark">Something went wrong. Please try again.</p>}
      </div>
    </form>
  );
}

/** A small "Feedback" tab fixed to the corner of dashboard pages. */
export function FeedbackButton({ siteId }: { siteId?: string }) {
  const page = usePathname();
  const [open, setOpen] = useState(false);
  const [useful, setUseful] = useState<"yes" | "no" | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = String(new FormData(e.currentTarget).get("body") ?? "").trim();
    if (!useful && !body) return;
    setStatus("sending");
    setStatus((await send(e.currentTarget, { kind: "feedback", page, useful: useful ?? "", site: siteId ?? "" })) ? "done" : "error");
  }

  function close() {
    setOpen(false);
    setUseful(null);
    setStatus("idle");
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div role="dialog" aria-label="Feedback" className="w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(18,20,28,0.18)]">
          {status === "done" ? (
            <div className="flex flex-col gap-3">
              <Thanks title="Thanks for the feedback." text="It goes straight to the Rivl team." />
              <button type="button" onClick={close} className="cursor-pointer self-end text-sm font-bold text-data-dark hover:text-ink">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <p className="m-0 text-base font-bold">Was this page useful?</p>
              <div className="flex gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={useful === v}
                    onClick={() => setUseful(v)}
                    className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] text-[15px] font-bold ${
                      useful === v ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink hover:border-ink"
                    }`}
                  >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={v === "no" ? "rotate-180" : ""}>
                      <path d="M7 10v11H4V10zM7 10l4-7a2 2 0 0 1 3 2l-1 5h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 21H7" />
                    </svg>
                    {v === "yes" ? "Yes" : "Not really"}
                  </button>
                ))}
              </div>
              <label className={label}>
                <span>What would make it better? {optional}</span>
                <textarea name="body" rows={3} className={`${input} py-2.5 text-[15px]`} />
              </label>
              {trap}
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={close} className="cursor-pointer text-sm font-semibold text-muted hover:text-ink">
                  Cancel
                </button>
                <button type="submit" disabled={status === "sending"} className={`${submit} min-h-11 px-5 text-[15px]`}>
                  {status === "sending" ? "Sending…" : "Send"}
                </button>
              </div>
              {status === "error" && <p className="m-0 text-sm font-semibold text-accent-dark">Couldn’t send that. Please try again.</p>}
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="min-h-11 cursor-pointer rounded-full bg-ink px-4.5 text-sm font-bold text-paper shadow-[0_6px_16px_rgba(18,20,28,0.25)] hover:bg-ink-3"
      >
        {open ? "Close" : "Feedback"}
      </button>
    </div>
  );
}

/** "Is a price wrong or out of date?" on a real business's page. */
export function CorrectionForm({ businessId, businessName, items, siteId }: { businessId: string; businessName: string; items: { id: string; label: string }[]; siteId?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!String(data.get("body") ?? "").trim() && !String(data.get("suggested_price") ?? "").trim()) {
      setError("Tell us what’s wrong, or the correct price");
      return;
    }
    setError(null);
    setStatus("sending");
    setStatus((await send(e.currentTarget, { kind: "correction", business_id: businessId, site: siteId ?? "", page: window.location.pathname })) ? "done" : "error");
  }

  if (status === "done") return <Thanks title="Thanks, we’ll check it." text={`We’ll re-check ${businessName}’s published prices and update this page.`} />;

  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-line bg-surface px-5 py-5 sm:px-7">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center justify-between gap-3 text-left text-[17px] font-bold text-ink"
      >
        Is a price here wrong or out of date?
        <span aria-hidden="true" className="text-data-dark">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
            <label className={label}>
              Price item
              <select name="item_id" className={input} defaultValue={items[0]?.id}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              <span>Correct price {optional}</span>
              <input name="suggested_price" inputMode="decimal" placeholder="£0.00" className={input} />
            </label>
            <label className={label}>
              <span>Your email {optional}</span>
              <input name="email" type="email" autoComplete="email" className={input} />
            </label>
          </div>
          <label className={label}>
            <span>What’s wrong? {optional}</span>
            <textarea name="body" rows={3} placeholder="e.g. They raised it in October, or this isn’t like for like" className={`${input} py-2.5`} />
          </label>
          {trap}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === "sending"} className={submit}>
              {status === "sending" ? "Sending…" : "Send correction"}
            </button>
            {(error || status === "error") && (
              <p role="alert" className="m-0 text-sm font-semibold text-accent-dark">
                {error ?? "Couldn’t send that. Please try again."}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
