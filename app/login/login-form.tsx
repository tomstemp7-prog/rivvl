"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendLoginCode, verifyLoginCode } from "@/app/auth-actions";

const input =
  "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-[17px] font-medium text-ink aria-invalid:border-accent-dark";
const button =
  "min-h-12 cursor-pointer rounded-xl bg-ink px-6 text-base font-bold text-paper hover:bg-ink-3 disabled:cursor-default disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await sendLoginCode(email, next);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else setStep("code");
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await verifyLoginCode(email, code);
    if ("error" in result) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const alert = error && (
    <p role="alert" className="m-0 text-[15px] font-semibold text-accent-dark">
      {error}
    </p>
  );

  if (step === "code") {
    return (
      <form onSubmit={onVerify} className="flex flex-col gap-4">
        <p className="m-0 rounded-xl bg-data-tint px-4 py-3 text-[15px] text-data-dark">
          We’ve emailed a code to <b>{email}</b>. It can take a minute; check spam if it’s not there. You can also click the link in the
          email instead.
        </p>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Code from the email
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            aria-invalid={!!error}
            className={`${input} tracking-[0.3em]`}
          />
        </label>
        {alert}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className={button}>
            {busy ? "Checking…" : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="cursor-pointer text-[15px] font-semibold text-body underline hover:text-ink"
          >
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSend} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          aria-invalid={!!error}
          className={input}
        />
      </label>
      {alert}
      <button type="submit" disabled={busy} className={`${button} self-start`}>
        {busy ? "Sending…" : "Email me a code"}
      </button>
    </form>
  );
}
