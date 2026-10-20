"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Interactive street map (MapLibre + OpenFreeMap vector tiles): drag, zoom,
 * rotate, full screen. Price labels are map symbols, so ones that would
 * overlap hide until you zoom in, as on Google or Apple Maps. Tapping a
 * business opens a card linking to its page.
 */
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const MILES_PER_DEG = 69.05;

export type MapPin = {
  id: string;
  name: string;
  /** Short pin text, e.g. "PureGym · £32.99". Null for businesses without a price. */
  label: string | null;
  priceText: string | null;
  detail: string;
  miles: number;
  bearing: number;
  lat?: number;
  lng?: number;
  dark?: boolean;
  href: string;
};

type Props = {
  center: { lat: number; lng: number };
  radiusMiles: number;
  youLabel: string;
  pins: MapPin[];
  ariaLabel: string;
};

/** A pin's position: exact for real businesses, else from its distance and bearing (0 = east, clockwise). */
function position(p: MapPin, center: Props["center"]): [number, number] {
  if (p.lat !== undefined && p.lng !== undefined) return [p.lng, p.lat];
  const rad = (p.bearing * Math.PI) / 180;
  const north = -Math.sin(rad) * p.miles;
  const east = Math.cos(rad) * p.miles;
  return [center.lng + east / (MILES_PER_DEG * Math.cos((center.lat * Math.PI) / 180)), center.lat + north / MILES_PER_DEG];
}

function circle(center: Props["center"], miles: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring: [number, number][] = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * 2 * Math.PI;
    ring.push([
      center.lng + (Math.cos(a) * miles) / (MILES_PER_DEG * Math.cos((center.lat * Math.PI) / 180)),
      center.lat + (Math.sin(a) * miles) / MILES_PER_DEG,
    ]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

/** A stretchable rounded "pill" for price labels, drawn once on a canvas. */
function pill(fill: string, stroke: string) {
  const w = 64, h = 48, r = 20;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, w - 2, h - 2, r);
  ctx.fill();
  ctx.stroke();
  return {
    data: ctx.getImageData(0, 0, w, h),
    options: { pixelRatio: 2, stretchX: [[r, w - r]] as [number, number][], stretchY: [[r, h - r]] as [number, number][], content: [r, 8, w - r, h - 8] as [number, number, number, number] },
  };
}

export function MarketMap({ center, radiusMiles, youLabel, pins, ariaLabel }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const youRef = useRef<Marker | null>(null);
  const fittedFor = useRef("");
  // Set once our sources and layers exist (isStyleLoaded() flickers false while sources load).
  const ready = useRef(false);
  const props = useRef({ center, radiusMiles, youLabel, pins });
  props.current = { center, radiusMiles, youLabel, pins };
  const router = useRouter();

  /** Pushes the latest props into the map's sources. */
  function sync() {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const { center, radiusMiles, youLabel, pins } = props.current;
    (map.getSource("rivl-radius") as GeoJSONSource | undefined)?.setData(circle(center, radiusMiles));
    (map.getSource("rivl-pins") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: pins.map((p) => ({
        type: "Feature",
        properties: { id: p.id, label: p.label ?? "", priced: !!p.label, dark: !!p.dark, miles: p.miles },
        geometry: { type: "Point", coordinates: position(p, center) },
      })),
    });
    if (youRef.current) {
      youRef.current.setLngLat([center.lng, center.lat]);
      youRef.current.getElement().textContent = youLabel;
    }
    // Re-frame only when the area changes, not on every update, so a user's own panning sticks.
    const key = `${center.lat},${center.lng},${radiusMiles}`;
    if (fittedFor.current !== key) {
      const coords = circle(center, radiusMiles).geometry.coordinates[0];
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 28, duration: fittedFor.current ? 600 : 0 },
      );
      fittedFor.current = key;
    }
  }

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !container.current) return;
      // Served from public/ (see scripts/copy-maplibre-worker.mjs).
      ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const { center } = props.current;
      map = new ml.Map({
        container: container.current,
        style: STYLE,
        center: [center.lng, center.lat],
        zoom: 12,
        attributionControl: { compact: true },
        // On touch screens one finger scrolls the page and two move the map, like embedded Google Maps.
        cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
      });
      mapRef.current = map;
      map.addControl(new ml.NavigationControl(), "top-right");
      map.addControl(new ml.FullscreenControl(), "top-right");

      const you = document.createElement("div");
      you.className = "rounded-xl bg-data px-3.5 py-2 text-[15px] font-bold whitespace-nowrap text-white shadow-[0_6px_16px_rgba(46,91,255,0.35)]";
      you.textContent = props.current.youLabel;
      youRef.current = new ml.Marker({ element: you }).setLngLat([center.lng, center.lat]).addTo(map);

      map.on("load", () => {
        if (!map) return;
        const light = pill("#FFFDF8", "#CFC8B8");
        const dark = pill("#12141C", "#12141C");
        map.addImage("rivl-pill", light.data, light.options);
        map.addImage("rivl-pill-dark", dark.data, dark.options);
        map.addSource("rivl-radius", { type: "geojson", data: circle(center, props.current.radiusMiles) });
        map.addSource("rivl-pins", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "rivl-radius-fill", type: "fill", source: "rivl-radius", paint: { "fill-color": "#2E5BFF", "fill-opacity": 0.06 } });
        map.addLayer({
          id: "rivl-radius-line",
          type: "line",
          source: "rivl-radius",
          paint: { "line-color": "#2E5BFF", "line-width": 2, "line-dasharray": [2, 2] },
        });
        map.addLayer({
          id: "rivl-dots",
          type: "circle",
          source: "rivl-pins",
          paint: {
            "circle-radius": ["case", ["get", "priced"], 6, 5],
            "circle-color": ["case", ["get", "priced"], "#FF6A3D", "#5B5F6A"],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "rivl-labels",
          type: "symbol",
          source: "rivl-pins",
          filter: ["get", "priced"],
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 13,
            "text-max-width": 40,
            "text-anchor": "bottom",
            "text-offset": [0, -1.1],
            "icon-image": ["case", ["get", "dark"], "rivl-pill-dark", "rivl-pill"],
            "icon-text-fit": "both",
            "icon-text-fit-padding": [3, 8, 3, 8],
            // Nearest businesses win when labels collide.
            "symbol-sort-key": ["get", "miles"],
          },
          paint: { "text-color": ["case", ["get", "dark"], "#F6F3EC", "#12141C"] },
        });
        ready.current = true;
        sync();
      });

      const open = (e: { features?: { properties: Record<string, unknown> }[]; lngLat: { lng: number; lat: number } }) => {
        const id = e.features?.[0]?.properties.id;
        const pin = props.current.pins.find((p) => p.id === id);
        if (!pin || !map) return;
        // Business names come from open data, so build the card with text nodes, never HTML.
        const card = document.createElement("div");
        card.className = "flex flex-col gap-1 pr-4 font-sans";
        const title = document.createElement("strong");
        title.className = "text-[15px] text-ink";
        title.textContent = pin.name;
        const price = document.createElement("span");
        price.className = pin.priceText ? "text-lg font-bold text-ink" : "text-sm text-muted";
        price.textContent = pin.priceText ?? "No published price";
        const detail = document.createElement("span");
        detail.className = "text-[13px] text-muted";
        detail.textContent = pin.detail;
        const link = document.createElement("a");
        link.href = pin.href;
        link.className = "mt-1 text-[13px] font-bold text-data-dark";
        link.textContent = "View details →";
        link.addEventListener("click", (ev) => {
          ev.preventDefault();
          router.push(pin.href);
        });
        card.append(title, price, detail, link);
        new ml.Popup({ offset: 14, maxWidth: "260px" }).setLngLat(e.lngLat).setDOMContent(card).addTo(map);
      };
      for (const layer of ["rivl-labels", "rivl-dots"]) {
        map.on("click", layer, open);
        map.on("mouseenter", layer, () => map && (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => map && (map.getCanvas().style.cursor = ""));
      }
    });
    return () => {
      cancelled = true;
      ready.current = false;
      map?.remove();
      mapRef.current = null;
    };
    // The map is created once; later prop changes go through sync().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sync();
  });

  // MapLibre makes its container position:relative, so size it from a wrapper.
  return (
    <div className="absolute inset-0">
      <div ref={container} role="region" aria-label={ariaLabel} className="h-full w-full" />
    </div>
  );
}
