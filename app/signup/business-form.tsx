"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { rivalsWithin } from "@/lib/mock-market";
import { lookupPostcode, normalisePostcode, POSTCODE_SHAPE, type Lookup } from "@/lib/postcode";
import { profileQuery, type Profile } from "@/lib/profile";
import { launchedTownFor } from "@/lib/towns";
import { pluralFor, RADII, SECTORS } from "@/lib/sectors";

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

export function BusinessForm({ initial, demo = false }: { initial: Profile; demo?: boolean }) {
  const router = useRouter();
  const [sector, setSector] = useState(initial.sector);
  const [radius, setRadius] = useState(initial.radius);
  const [name, setName] = useState(initial.name);
  const [postcode, setPostcode] = useState(initial.postcode);
  const [submitted, setSubmitted] = useState(false);
  // Result of checking the postcode against the real UK list, keyed by what was checked.
  const [lookup, setLookup] = useState<{ for: string; result: Lookup } | null>(null);

  const shaped = POSTCODE_SHAPE.test(postcode.trim());
  const normalised = normalisePostcode(postcode);
  const current = lookup?.for === normalised ? lookup.result : null;
  const checking = shaped && !current;
  const place = current?.status === "found" ? current.place : null;

  useEffect(() => {
    if (!shaped) return;
    const timer = setTimeout(async () => {
      const result = await lookupPostcode(normalised);
      setLookup({ for: normalised, result });
    }, 300);
    return () => clearTimeout(timer);
  }, [shaped, normalised]);

  const nameError = submitted && !name.trim() ? "Enter your business name" : null;
  const postcodeError =
    current?.status === "invalid"
      ? "We can’t find that postcode. Check it and try again."
      : submitted && !shaped
        ? "Enter a full UK postcode, like SL6 7AA"
        : null;
  // Launched towns count real businesses, so ask the server; fall back to the sample count meanwhile.
  const [nearby, setNearby] = useState<{ key: string; count: number } | null>(null);
  const nearbyKey = place ? `${place.postcode}|${sector}|${radius}` : "";
  useEffect(() => {
    if (!nearbyKey) return;
    const [pc, sec, rad] = nearbyKey.split("|");
    const controller = new AbortController();
    fetch(`/api/nearby?${new URLSearchParams({ postcode: pc, sector: sec, radius: rad })}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { count: number }) => setNearby({ key: nearbyKey, count: data.count }))
      .catch(() => {});
    return () => controller.abort();
  }, [nearbyKey]);
  const found = nearby?.key === nearbyKey ? nearby.count : rivalsWithin(radius).length;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    // If postcodes.io is unreachable, don't block sign-up; the shape check still applies.
    if (!name.trim() || !shaped || checking || current?.status === "invalid") return;
    const pc = place?.postcode ?? normalised;
    // Outside a launched town, register interest unless they chose the demo or are coming back with the same postcode.
    if (!demo && !launchedTownFor(pc) && pc !== initial.postcode) {
      router.push(`/interest?${profileQuery({ name: name.trim(), sector, postcode: pc })}`);
      return;
    }
    router.push(`/signup/prices?${profileQuery({ name: name.trim(), sector, postcode: pc, radius })}`);
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
            placeholder="e.g. SL6 7AA"
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
          {place
            ? `We found ${found} ${pluralFor(sector)} within ${radius} of ${place.postcode}, ${place.district}.`
            : checking
              ? "Checking your postcode…"
              : shaped && current?.status === "unavailable"
                ? `We found ${found} ${pluralFor(sector)} within ${radius} of ${normalised}.`
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
