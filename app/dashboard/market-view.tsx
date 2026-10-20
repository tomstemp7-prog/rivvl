"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Market } from "@/lib/markets";
import { median, MOCK_UPDATED, monthName, radiusMiles, rivalName, rivalsWithin, type Rival } from "@/lib/mock-market";
import { StreetMap } from "@/components/street-map";
import { areaLabel, type Place } from "@/lib/postcode";
import { formatPrice, profileQuery, type Profile } from "@/lib/profile";
import { itemsFor, pluralFor, RADII } from "@/lib/sectors";

const select =
  "min-h-11 rounded-[10px] border-[1.5px] border-line-strong bg-surface px-3 text-[15px] font-semibold text-ink";
const statCard = "flex flex-col gap-1.5 rounded-[18px] border border-line bg-surface px-5.5 py-5";
const statLabel = "text-[13px] font-semibold text-muted";
const statValue = "font-display text-[34px] font-semibold";

type Entry = { id: string; name: string; short: string; price: number; detail: string; tone?: "up" | "new"; you?: boolean; rival?: Rival };

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const PIN_H = 34;

/**
 * Places pins at their true bearing/distance (in px from the map centre), then
 * nudges overlapping labels apart vertically. Index 0 is "You" and stays put.
 */
function layoutPins(pins: { x: number; y: number; label: string }[]) {
  const pts = pins.map((p) => ({ ...p, w: p.label.length * 7.5 + 40 }));
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        const overlapX = (a.w + b.w) / 2 + 6 - Math.abs(a.x - b.x);
        const overlapY = PIN_H + 6 - Math.abs(a.y - b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const dir = b.y >= a.y ? 1 : -1;
        if (i === 0) b.y += dir * overlapY;
        else {
          a.y -= (dir * overlapY) / 2;
          b.y += (dir * overlapY) / 2;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return pts;
}

export function MarketView({ profile, place, market }: { profile: Profile; place: Place | null; market: Market }) {
  const items = itemsFor(profile.sector);
  const [itemId, setItemId] = useState(items[0].id);
  const [radius, setRadius] = useState(profile.radius);
  const [zoom, setZoom] = useState(1);
  const [mapWidth, setMapWidth] = useState(800);
  const [mapHeight, setMapHeight] = useState(600);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMapWidth(rect.width);
    setMapHeight(rect.height);
    const ro = new ResizeObserver(([entry]) => {
      setMapWidth(entry.contentRect.width);
      setMapHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const item = items.find((i) => i.id === itemId) ?? items[0];
  const limited = !profile.shared;
  const yourPrice = limited ? null : (profile.prices[item.id] ?? null);
  const plural = pluralFor(profile.sector);
  const query = profileQuery(profile);

  const nearby = rivalsWithin(radius, market.rivals);
  const rivals = nearby.filter((r) => r.prices[item.id] !== undefined);
  // Real businesses that don't publish this price still belong on the map, just without a price.
  const unpriced = market.real ? nearby.filter((r) => r.prices[item.id] === undefined) : [];
  const anyPrices = market.rivals.some((r) => Object.keys(r.prices).length > 0);
  const latestCheck = market.real && anyPrices
    ? market.rivals.filter((r) => r.real?.priceUrl).map((r) => r.checked).sort().at(-1) ?? market.fetched
    : null;
  const entries: Entry[] = rivals.map((r) => ({
    id: r.id,
    // The limited view hides who's who until the owner shares their prices.
    name: rivalName(r, profile, false, market.rivals),
    short: rivalName(r, profile, true, market.rivals),
    price: r.prices[item.id],
    detail: r.note && !limited ? r.note.text : [`${r.miles} miles`, r.segment].filter(Boolean).join(" · "),
    tone: limited ? undefined : r.note?.tone,
    rival: r,
  }));
  if (yourPrice !== null) {
    entries.push({ id: "you", name: `${profile.name} (you)`, short: "You", price: yourPrice, detail: `Your ${profile.sector.toLowerCase()}`, you: true });
  }
  entries.sort((a, b) => a.price - b.price);

  const areaMedian = median(entries.map((e) => e.price));
  const position = entries.findIndex((e) => e.you) + 1;
  const diff = yourPrice !== null && areaMedian !== null ? yourPrice - areaMedian : null;
  // Price rises and new openings both count as market changes.
  const changes = rivals.filter((r) => r.note).length;
  const ringPx = Math.min(228, mapWidth * 0.44) * zoom;
  const maxMiles = radiusMiles(radius);
  const mapped = entries.filter((e) => e.rival);
  const youLabel = yourPrice !== null ? `You · ${formatPrice(yourPrice)}` : "You";
  const pins = layoutPins([
    { x: 0, y: 0, label: youLabel },
    ...mapped.map((e) => {
      const rad = (e.rival!.bearing * Math.PI) / 180;
      const d = (e.rival!.miles / maxMiles) * ringPx;
      return { x: Math.cos(rad) * d, y: Math.sin(rad) * d, label: `${e.short} · ${formatPrice(e.price)}` };
    }),
  ])
    .slice(1)
    // Keep labels inside the map horizontally on narrow screens.
    .map((p) => {
      const maxX = Math.max(0, mapWidth / 2 - p.w / 2 - 8);
      return { ...p, x: Math.max(-maxX, Math.min(maxX, p.x)) };
    });
  const dots = unpriced.map((r) => {
    const rad = (r.bearing * Math.PI) / 180;
    const d = (r.miles / maxMiles) * ringPx;
    const clamp = (v: number, half: number) => Math.max(-half + 10, Math.min(half - 10, v));
    return { r, x: clamp(Math.cos(rad) * d, mapWidth / 2), y: clamp(Math.sin(rad) * d, mapHeight / 2) };
  });

  return (
    <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-6 px-4 pt-8 pb-12 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-sm font-semibold text-muted">
            {plural[0].toUpperCase() + plural.slice(1)} within {radius} of {areaLabel(profile.postcode, place)} ·{" "}
            {market.real
              ? `${anyPrices ? "prices checked" : "businesses as of"} ${new Date(latestCheck ?? market.fetched).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : `updated ${MOCK_UPDATED}`}
          </p>
          <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">Your local market</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <label className={`flex flex-col gap-1 text-xs font-bold text-muted ${anyPrices ? "" : "hidden"}`}>
            Price item
            <select className={select} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted">
            Radius
            <select className={select} value={radius} onChange={(e) => setRadius(e.target.value)}>
              {RADII.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {market.real && (
        <p className="m-0 rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] text-body">
          <strong className="text-ink">Real {market.town} businesses.</strong>{" "}
          {anyPrices
            ? `Prices are each business’s own published prices, with the source on its page. ${unpriced.length ? "Businesses that don’t publish this price show as grey dots." : ""}`
            : `We haven’t collected ${plural} prices in ${market.town} yet, so this shows who’s near you. Prices are coming soon.`}
        </p>
      )}

      {limited && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-data-tint px-5 py-4 text-data-dark">
          <p className="m-0 text-[15px] font-semibold">
            You’re seeing a limited view. Share your prices to see rivals by name and where you sit.
          </p>
          <Link href={`/signup/prices?${query}`} className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper hover:bg-ink-3">
            Share my prices
          </Link>
        </div>
      )}

      <div className={`grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 ${anyPrices ? "" : "hidden"}`}>
        <div className="flex flex-col gap-1.5 rounded-[18px] bg-ink px-5.5 py-5 text-paper">
          <span className="text-[13px] font-semibold text-on-dark-muted">Your price</span>
          <span className={statValue}>{yourPrice !== null ? formatPrice(yourPrice) : "—"}</span>
          {yourPrice !== null ? (
            <span className="text-[13px] text-on-dark-2">{item.label}</span>
          ) : (
            <Link href={`/signup/prices?${query}`} className="text-[13px] font-bold text-data-light hover:text-white">
              Add your {item.label.toLowerCase()} price
            </Link>
          )}
        </div>
        <div className={statCard}>
          <span className={statLabel}>Area median</span>
          <span className={statValue}>{areaMedian !== null ? formatPrice(areaMedian) : "—"}</span>
          {diff === null ? (
            <span className="text-[13px] text-muted">{entries.length} prices in range</span>
          ) : diff === 0 ? (
            <span className="text-[13px] font-bold text-data-dark">You’re right on the median</span>
          ) : (
            <span className={`text-[13px] font-bold ${diff < 0 ? "text-accent-dark" : "text-data-dark"}`}>
              You’re {formatPrice(Math.abs(Math.round(diff * 100) / 100))} {diff < 0 ? "below" : "above"}
            </span>
          )}
        </div>
        <div className={statCard}>
          <span className={statLabel}>Your position</span>
          <span className={statValue}>{position ? `${ordinal(position)} of ${entries.length}` : "—"}</span>
          <span className="text-[13px] text-muted">Cheapest first</span>
        </div>
        {market.real ? (
          <div className={statCard}>
            <span className={statLabel}>Tracking prices since</span>
            <span className={statValue}>{monthName(market.fetched.slice(0, 7), "axis")}</span>
            <Link href={`/dashboard/reports?${query}`} className="text-[13px] font-bold text-data-dark hover:text-ink">
              When reports start
            </Link>
          </div>
        ) : (
          <div className={statCard}>
            <span className={statLabel}>Changes this quarter</span>
            <span className={statValue}>{changes}</span>
            <Link href={`/dashboard/reports?${query}`} className="text-[13px] font-bold text-data-dark hover:text-ink">
              See October report
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        {/* Map */}
        <div
          role="img"
          aria-label={`Map of ${entries.length} ${plural} around ${areaLabel(profile.postcode, place)} with their ${item.label.toLowerCase()} prices`}
          ref={mapRef}
          className="relative h-[480px] min-w-0 flex-[999_1_520px] overflow-hidden rounded-[22px] bg-map sm:h-[600px]"
        >
          {place ? (
            <StreetMap lat={place.lat} lng={place.lng} metersPerPx={(maxMiles * 1609.34) / ringPx} width={mapWidth} height={mapHeight} />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              <rect x="560" y="300" width="150" height="110" rx="18" fill="#D3DEC4" />
              <path d="M0 540 C 200 490, 380 590, 560 530 S 740 470, 800 490" stroke="#B9C7F0" strokeWidth="26" fill="none" />
              <g stroke="#F6F3EC" strokeWidth="7" fill="none" strokeLinecap="round">
                <path d="M0 300 L800 280" />
                <path d="M240 0 L320 600" />
                <path d="M600 0 L580 600" />
              </g>
              <g stroke="#FFFDF8" strokeWidth="16" fill="none" strokeLinecap="round">
                <path d="M0 120 L800 90" />
                <path d="M0 460 L800 500" />
                <path d="M100 0 L150 600" />
                <path d="M440 0 L410 600" />
                <path d="M700 0 L760 600" />
              </g>
            </svg>
          )}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-data bg-data/6 transition-all"
            style={{ width: ringPx * 2, height: ringPx * 2 }}
          />
          {dots.map(({ r, x, y }) => (
            <Link
              key={r.id}
              href={`/dashboard/competitors/${r.id}?${query}`}
              title={`${rivalName(r, profile, false, market.rivals)}: no published price`}
              aria-label={`${rivalName(r, profile, false, market.rivals)}, ${r.miles} miles, no published price`}
              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-muted shadow-[0_2px_6px_rgba(18,20,28,0.25)] hover:z-10 hover:scale-150"
              style={{ left: `calc(50% + ${x.toFixed(1)}px)`, top: `calc(50% + ${y.toFixed(1)}px)` }}
            />
          ))}
          {mapped.map((e, i) => {
              const dark = e.tone === "up";
              return (
                <Link
                  key={e.id}
                  href={`/dashboard/competitors/${e.id}?${query}`}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl px-3 py-1.75 text-sm font-bold whitespace-nowrap shadow-[0_4px_12px_rgba(18,20,28,0.15)] transition-all hover:z-10 hover:scale-105 ${
                    dark ? "bg-ink text-paper" : "bg-surface text-ink"
                  }`}
                  style={{ left: `calc(50% + ${pins[i].x.toFixed(1)}px)`, top: `calc(50% + ${pins[i].y.toFixed(1)}px)` }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  {pins[i].label}
                </Link>
              );
            })}
          <p className="absolute top-1/2 left-1/2 z-[1] m-0 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-data px-3.5 py-2 text-[15px] font-bold whitespace-nowrap text-white shadow-[0_6px_16px_rgba(46,91,255,0.35)]">
            {youLabel}
          </p>
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            <span className="rounded-[10px] bg-surface px-3 py-2 text-[13px] font-semibold text-body-strong">
              Dashed ring: {radius.replace(" miles", "-mile").replace(" mile", "-mile")} radius
            </span>
            <span className="rounded-[10px] bg-surface px-3 py-2 text-[13px] font-semibold text-body-strong">
              {market.real ? `Real ${market.town} businesses` : "Illustrative data"}
            </span>
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-1.5">
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoom >= 1.6}
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}
              className="h-11 w-11 cursor-pointer rounded-xl bg-surface text-[22px] font-semibold text-ink hover:bg-white disabled:cursor-default disabled:opacity-50"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoom <= 0.6}
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="h-11 w-11 cursor-pointer rounded-xl bg-surface text-[22px] font-semibold text-ink hover:bg-white disabled:cursor-default disabled:opacity-50"
            >
              −
            </button>
          </div>
        </div>

        {/* Ranked list */}
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-1 rounded-[22px] border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3 px-1.5 pt-1 pb-3">
            <h2 className="m-0 text-[17px] font-bold whitespace-nowrap">{anyPrices ? "Ranked by price" : `Near you (${unpriced.length})`}</h2>
            {anyPrices && <span className="truncate text-[13px] text-muted">{item.label}</span>}
          </div>
          {entries.length === 0 && anyPrices && (
            <p className="m-0 px-3 text-[15px] text-muted">
              {market.real ? `No published ${item.label.toLowerCase()} prices within ${radius} yet.` : `No ${plural} list this item within ${radius}.`}
            </p>
          )}
          {entries.map((e) => {
            const inner = (
              <>
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold">{e.name}</span>
                  <span
                    className={`text-[13px] ${
                      e.you ? "" : e.tone === "up" ? "font-semibold text-accent-dark" : e.tone === "new" ? "font-semibold text-data-dark" : "text-muted"
                    }`}
                  >
                    {e.detail}
                  </span>
                </span>
                <span className="font-bold">{formatPrice(e.price)}</span>
              </>
            );
            return e.you ? (
              <div key={e.id} className="flex min-h-14 items-center justify-between rounded-xl bg-data-tint px-3 text-data-dark">
                {inner}
              </div>
            ) : (
              <Link
                key={e.id}
                href={`/dashboard/competitors/${e.id}?${query}`}
                className="flex min-h-14 items-center justify-between rounded-xl border-t border-sand px-3 text-ink hover:bg-paper"
              >
                {inner}
              </Link>
            );
          })}
          {unpriced.length > 0 && (
            <>
              {anyPrices && <h3 className="m-0 px-1.5 pt-5 pb-2 text-[15px] font-bold">No published price ({unpriced.length})</h3>}
              {unpriced.map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/competitors/${r.id}?${query}`}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-t border-sand px-3 text-ink hover:bg-paper"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-semibold">{rivalName(r, profile, false, market.rivals)}</span>
                    <span className="text-[13px] text-muted">{r.miles} miles</span>
                  </span>
                  {anyPrices && <span className="flex-none text-[13px] text-muted">{r.real?.priceNote ?? "Not collected"}</span>}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
