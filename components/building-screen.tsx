"use client";

import { useEffect, useState } from "react";

/**
 * The full-screen "building your market" moment after an owner shares their
 * prices: steps ticking off and a rotating fact. Every fact is real (Rivl's
 * own research or a cited source); the wait is a short minimum the form adds
 * on top of the save, so it feels like the work it describes.
 */
export type Fact = { figure: string; text: string; source: string };

export const BUILD_MS = 6000;
const FACT_MS = 3000;

export function BuildingScreen({ steps, facts }: { steps: string[]; facts: Fact[] }) {
  const [step, setStep] = useState(0);
  const [fact, setFact] = useState(0);

  useEffect(() => {
    const per = BUILD_MS / steps.length;
    const s = setInterval(() => setStep((n) => Math.min(n + 1, steps.length - 1)), per);
    const f = setInterval(() => setFact((n) => (n + 1) % Math.max(facts.length, 1)), FACT_MS);
    return () => {
      clearInterval(s);
      clearInterval(f);
    };
  }, [steps.length, facts.length]);

  const current = facts[fact];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="building-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink px-4 py-10 text-paper">
      <div className="flex w-full max-w-[520px] flex-col gap-9">
        <div className="flex flex-col gap-5">
          <span aria-hidden="true" className="h-12 w-12 rounded-full border-4 border-ink-line border-t-accent motion-safe:animate-spin" />
          <h2 id="building-title" className="m-0 font-display text-3xl leading-tight font-semibold sm:text-4xl">
            Building your local market
          </h2>
          <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-live="polite">
            {steps.map((label, i) => (
              <li key={label} className={`flex items-center gap-3 text-[17px] ${i <= step ? "text-paper" : "text-on-dark-muted"}`}>
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[13px] font-bold ${
                    i < step ? "bg-accent text-ink" : i === step ? "border-2 border-accent" : "border-2 border-ink-line"
                  }`}
                >
                  {i < step ? "✓" : ""}
                </span>
                {label}
                <span className="sr-only">{i < step ? "(done)" : i === step ? "(in progress)" : ""}</span>
              </li>
            ))}
          </ol>
        </div>

        {current && (
          <div className="flex flex-col gap-2 rounded-[22px] bg-ink-2 p-6">
            <p className="eyebrow m-0 text-[13px] text-accent">Did you know?</p>
            <div key={fact} className="flex flex-col gap-2 motion-safe:animate-card-in">
              <p className="m-0 font-display text-[40px] leading-none font-semibold text-accent">{current.figure}</p>
              <p className="m-0 text-[17px] leading-normal text-on-dark">{current.text}</p>
              <p className="m-0 text-[13px] text-on-dark-muted">{current.source}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
