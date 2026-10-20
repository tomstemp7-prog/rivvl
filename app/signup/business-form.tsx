"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rivalsWithin } from "@/lib/mock-market";
import { profileQuery, type Profile } from "@/lib/profile";
import { pluralFor, RADII, SECTORS } from "@/lib/sectors";

const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const input =
  "rounded-xl border-[1.5px] border-line-strong bg-surface px-4 py-3.5 text-[17px] font-medium text-ink aria-invalid:border-accent-dark";

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`pill-toggle ${pressed ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink hover:border-ink"}`}
    >
      {children}
    </button>
  );
}

export function BusinessForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [sector, setSector] = useState(initial.sector);
  const [radius, setRadius] = useState(initial.radius);
  const [name, setName] = useState(initial.name);
  const [postcode, setPostcode] = useState(initial.postcode);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? "Enter your business name" : null;
  const postcodeError = submitted && !POSTCODE.test(postcode.trim()) ? "Enter a full UK postcode, like RG1 3EU" : null;
  const validPostcode = POSTCODE.test(postcode.trim());
  const found = rivalsWithin(radius).length;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !validPostcode) return;
    router.push(`/signup/prices?${profileQuery({ name: name.trim(), sector, postcode: postcode.trim().toUpperCase(), radius })}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
      <fieldset className="m-0 flex flex-col gap-3.5 border-none p-0">
        <legend className="mb-3.5 p-0 text-[17px] font-bold">What type of business are you?</legend>
        <div className="flex flex-wrap gap-2.5">
          {SECTORS.map((s) => (
            <Toggle key={s.label} pressed={sector === s.label} onClick={() => setSector(s.label)}>
              {s.label}
            </Toggle>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-5">
        <label className="flex flex-[1_1_240px] flex-col gap-2 text-[15px] font-bold">
          Business name
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Iron & Oak Fitness"
            autoComplete="organization"
            aria-invalid={!!nameError}
          />
          {nameError && <span className="text-sm font-semibold text-accent-dark">{nameError}</span>}
        </label>
        <label className="flex flex-[1_1_200px] flex-col gap-2 text-[15px] font-bold">
          Postcode
          <input
            className={input}
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. RG1 3EU"
            autoComplete="postal-code"
            aria-invalid={!!postcodeError}
          />
          {postcodeError && <span className="text-sm font-semibold text-accent-dark">{postcodeError}</span>}
        </label>
      </div>

      <fieldset className="m-0 flex flex-col gap-3.5 border-none p-0">
        <legend className="mb-3.5 p-0 text-[17px] font-bold">How far do your customers travel?</legend>
        <div className="flex flex-wrap gap-2.5">
          {RADII.map((r) => (
            <Toggle key={r} pressed={radius === r} onClick={() => setRadius(r)}>
              {r}
            </Toggle>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3.5 rounded-2xl bg-data-tint px-5 py-4.5" aria-live="polite">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F3FB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
          <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <p className="m-0 text-base font-semibold text-data-dark">
          {validPostcode
            ? `We found ${found} ${pluralFor(sector)} within ${radius} of ${postcode.trim().toUpperCase()}.`
            : `Enter your postcode to see how many ${pluralFor(sector)} are within ${radius}.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="flex min-h-[54px] cursor-pointer items-center justify-center rounded-[14px] bg-ink px-8 text-base font-bold text-paper hover:bg-ink-3"
        >
          Continue
        </button>
        <Link href="/" className="text-base font-semibold text-body underline hover:text-ink">
          Back
        </Link>
      </div>
    </form>
  );
}
