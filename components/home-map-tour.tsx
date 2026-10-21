"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TourStop } from "@/lib/markets";
import { formatPrice } from "@/lib/profile";
import { SECTORS } from "@/lib/sectors";
import { circle, pill } from "./market-map";

/**
 * The home page hero: a real map of a launched town that tours businesses
 * publishing their prices, flying to each and opening its price card. Tapping
 * a pin, dragging the map or using the card's buttons takes over from the tour.
 */
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const STEP_MS = 6000;

type Props = {
  town: string;
  centre: { lat: number; lng: number };
  miles: number;
  stops: TourStop[];
  dots: [number, number][];
};

/** "9, Norfolk Road, Maidenhead" → "9 Norfolk Road". */
const street = (address: string) => {
  const [a, b] = address.split(",").map((p) => p.trim());
  return /^\d+[a-z]?$/i.test(a) && b ? `${a} ${b}` : a;
};

const checkedText = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function HomeMapTour({ town, centre, miles, stops, dots }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const reduced = useRef(false);

  // Create the map once.
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPlaying(false);
    let cancelled = false;
    let map: MapLibreMap | undefined;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !container.current) return;
      ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const ring = circle(centre, miles).geometry.coordinates[0];
      const lngs = ring.map((c) => c[0]);
      const lats = ring.map((c) => c[1]);
      map = new ml.Map({
        container: container.current,
        style: STYLE,
        bounds: [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        fitBoundsOptions: { padding: 24 },
        // Credits go top right: the price card covers the bottom of the map.
        attributionControl: false,
        // The page scrolls past the hero, so the wheel never zooms; touch screens use two fingers.
        scrollZoom: false,
        cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
      });
      mapRef.current = map;
      map.addControl(new ml.AttributionControl({ compact: true }), "top-right");
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) return;
        const light = pill("#FFFDF8", "#CFC8B8");
        const dark = pill("#12141C", "#12141C");
        map.addImage("rivl-pill", light.data, light.options);
        map.addImage("rivl-pill-dark", dark.data, dark.options);
        map.addSource("tour-radius", { type: "geojson", data: circle(centre, miles) });
        map.addSource("tour-dots", {
          type: "geojson",
          data: { type: "FeatureCollection", features: dots.map((c) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: c } })) },
        });
        map.addSource("tour-stops", { type: "geojson", data: stopsData(stops, null) });
        map.addLayer({ id: "tour-radius-fill", type: "fill", source: "tour-radius", paint: { "fill-color": "#2E5BFF", "fill-opacity": 0.05 } });
        map.addLayer({ id: "tour-radius-line", type: "line", source: "tour-radius", paint: { "line-color": "#2E5BFF", "line-width": 2, "line-dasharray": [2, 2] } });
        map.addLayer({
          id: "tour-dots",
          type: "circle",
          source: "tour-dots",
          paint: { "circle-radius": 4, "circle-color": "#5B5F6A", "circle-opacity": 0.7, "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 1.5 },
        });
        map.addLayer({
          id: "tour-pins",
          type: "circle",
          source: "tour-stops",
          paint: {
            "circle-radius": ["case", ["get", "active"], 9, 6],
            "circle-color": ["case", ["get", "active"], "#12141C", "#FF6A3D"],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "tour-labels",
          type: "symbol",
          source: "tour-stops",
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 13,
            "text-anchor": "bottom",
            "text-offset": [0, -1.1],
            "icon-image": ["case", ["get", "active"], "rivl-pill-dark", "rivl-pill"],
            "icon-text-fit": "both",
            "icon-text-fit-padding": [3, 8, 3, 8],
            // The business being shown always wins a label collision.
            "symbol-sort-key": ["case", ["get", "active"], 0, 1],
          },
          paint: { "text-color": ["case", ["get", "active"], "#F6F3EC", "#12141C"] },
        });
        for (const layer of ["tour-pins", "tour-labels"]) {
          map.on("click", layer, (e) => {
            const i = stops.findIndex((s) => s.id === e.features?.[0]?.properties.id);
            if (i < 0) return;
            setPlaying(false);
            setActive(i);
          });
          map.on("mouseenter", layer, () => map && (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => map && (map.getCanvas().style.cursor = ""));
        }
        // Someone dragging or zooming the map has taken over from the tour.
        map.on("dragstart", () => setPlaying(false));
        map.on("zoomstart", (e) => e.originalEvent && setPlaying(false));
        // Start the credits folded into their ⓘ button so they don't cover the "Live in" badge.
        container.current?.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show");
        setReady(true);
      });
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // Created once; the props come from the server and don't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause while the hero is off screen.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The tour: a beat on the whole area, then one business every few seconds.
  useEffect(() => {
    if (!ready || !playing || !visible || !stops.length) return;
    const t = setTimeout(() => setActive((a) => (a === null ? 0 : (a + 1) % stops.length)), active === null ? 1800 : STEP_MS);
    return () => clearTimeout(t);
  }, [ready, playing, visible, active, stops.length]);

  // Fly to the business being shown and highlight its pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("tour-stops") as GeoJSONSource | undefined)?.setData(stopsData(stops, active));
    if (active === null) return;
    const s = stops[active];
    // Keep the pin above the price card, which covers the bottom of the map.
    const card = container.current?.parentElement?.querySelector<HTMLElement>("[data-tour-card]");
    map.flyTo({
      center: [s.lng, s.lat],
      zoom: 15,
      padding: { top: 40, bottom: (card?.offsetHeight ?? 200) + 20, left: 0, right: 0 },
      duration: reduced.current ? 0 : 2400,
      essential: false,
    });
  }, [ready, active, stops]);

  const stop = active === null ? null : stops[active];
  const sector = stop && SECTORS.find((s) => s.label === stop.sector);
  const go = (delta: number) => {
    setPlaying(false);
    setActive((a) => ((a ?? -1) + delta + stops.length) % stops.length);
  };

  return (
    <div className="relative h-[520px] min-w-0 flex-[1_1_460px] overflow-hidden rounded-[28px] bg-map">
      <div className="absolute inset-0">
        <div ref={container} role="region" aria-label={`Map of ${town} businesses that publish their prices`} className="h-full w-full" />
      </div>

      <p className="absolute top-4 left-4 m-0 flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-[13px] font-bold text-paper shadow-[0_6px_16px_rgba(18,20,28,0.25)]">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent motion-safe:animate-pulse" />
        Live in {town}
      </p>

      <div data-tour-card className="absolute right-3 bottom-3 left-3 flex flex-col gap-3 rounded-[20px] bg-surface p-4.5 shadow-[0_12px_32px_rgba(18,20,28,0.18)] sm:right-4 sm:bottom-4 sm:left-4">
        {stop ? (
          <div key={stop.id} className="flex flex-col gap-3 motion-safe:animate-card-in" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-muted">{stop.sector}{stop.address ? ` · ${street(stop.address)}` : ""}</span>
                <span className="line-clamp-2 font-display text-xl leading-tight font-semibold">{stop.name}</span>
              </div>
              <div className="flex flex-none gap-1">
                <TourButton label="Previous business" onClick={() => go(-1)} d="M15 18l-6-6 6-6" />
                <TourButton label={playing ? "Pause tour" : "Play tour"} onClick={() => setPlaying(!playing)} d={playing ? "M9 6v12M15 6v12" : "M8 5l11 7-11 7z"} />
                <TourButton label="Next business" onClick={() => go(1)} d="M9 6l6 6-6 6" />
              </div>
            </div>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {stop.prices.slice(0, 3).map((p) => (
                <li key={p.label} className="flex items-baseline justify-between gap-3 border-t border-line pt-1.5 text-[15px]">
                  <span className="min-w-0 truncate text-body">{p.label}</span>
                  <span className="flex flex-none items-baseline gap-2">
                    {p.median !== null && (
                      <span className="text-[13px] text-muted">
                        median {formatPrice(p.median)}
                      </span>
                    )}
                    <span className="font-bold text-ink">{formatPrice(p.price)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="text-[12px] text-muted">
                {stop.source ? `From ${stop.source}` : "From their website"}, checked {checkedText(stop.checked)}
              </span>
              <Link href={`/signup?sector=${encodeURIComponent(stop.sector)}`} className="text-[13px] font-bold text-data-dark hover:text-ink">
                Compare {sector?.plural ?? "prices"} near you →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-muted">Within {miles} miles of {town} town centre</span>
              <span className="font-display text-2xl font-semibold">
                {stops.length + dots.length} businesses, {stops.length} with published prices
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPlaying(true);
                setActive(0);
              }}
              className="min-h-11 cursor-pointer rounded-full bg-ink px-4 text-sm font-bold text-paper hover:bg-ink-3"
            >
              Show me
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TourButton({ label, onClick, d }: { label: string; onClick: () => void; d: string }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-ink hover:border-ink">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}

function stopsData(stops: TourStop[], active: number | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stops.map((s, i) => ({
      type: "Feature",
      properties: { id: s.id, active: i === active, label: s.prices[0] ? formatPrice(s.prices[0].price) : "" },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
    })),
  };
}
