"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/profile";

export type Series = {
  name: string;
  color: string;
  /** One value per x point; null where there's no data yet. */
  values: (number | null)[];
  dashed?: boolean;
  /** Label pinned to the right edge at the series' last value. */
  tag?: string;
  tagText?: string;
};

type Props = {
  series: Series[];
  /** Full label per x point, used in the hover tooltip. */
  points: string[];
  /** Axis labels: which point indexes to label, and how. */
  axis: { index: number; label: string }[];
  ariaLabel: string;
  height: number;
  /** Hold each value until the next point (prices change in steps). */
  step?: boolean;
};

const W = 640;
const PAD_Y = 40;
const TAG_H = 26;

export function LineChart({ series, points, axis, ariaLabel, height, step = false }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  // Step charts run edge to edge; point charts keep their end markers inside the frame.
  const inset = step ? 0 : 20;
  const xAt = (i: number) => inset + (n === 1 ? 0 : (i / (n - 1)) * (W - inset * 2));
  const xPct = (i: number) => (xAt(i) / W) * 100;

  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const lo = all.length ? Math.min(...all) : 0;
  const hi = all.length ? Math.max(...all) : 0;
  const pad = Math.max(2, (hi - lo) * 0.25);
  const yAt = (v: number) => PAD_Y + (1 - (v - (lo - pad)) / (hi - lo + pad * 2)) * (height - PAD_Y * 2);

  // Split each series into runs of non-null values.
  const lines = series.map((s) => {
    const runs: string[] = [];
    let run: string[] = [];
    s.values.forEach((v, i) => {
      if (v === null) {
        if (run.length) runs.push(run.join(" "));
        run = [];
        return;
      }
      const prev = s.values[i - 1];
      if (step && run.length && prev !== null && prev !== undefined && prev !== v) run.push(`${xAt(i)},${yAt(prev)}`);
      run.push(`${xAt(i)},${yAt(v)}`);
      // Step lines hold the last value to the right edge.
      if (step && i === n - 1 && n > 1) run.push(`${W},${yAt(v)}`);
    });
    if (run.length) runs.push(run.join(" "));
    return runs;
  });

  // Right-edge tags sit just off their line (top one above, the rest below) so the line stays visible.
  const tags = series
    .map((s) => {
      const last = [...s.values].reverse().find((v) => v !== null);
      return s.tag && last != null ? { s, y: yAt(last), top: 0 } : null;
    })
    .filter((t) => t !== null)
    .sort((a, b) => a.y - b.y);
  tags.forEach((t, i) => {
    t.top = i === 0 ? t.y - TAG_H - 6 : Math.max(t.y + 6, tags[i - 1].top + TAG_H + 4);
  });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((x - inset) / (W - inset * 2)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4.5 text-[13px] font-semibold text-body">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <svg aria-hidden="true" width="18" height="4">
              <line x1="0" y1="2" x2="18" y2="2" stroke={s.color} strokeWidth="4" strokeDasharray={s.dashed ? "5 3" : undefined} />
            </svg>
            {s.name}
          </span>
        ))}
      </div>
      <div className="relative" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <g stroke="#EFEAE0" strokeWidth="1">
            {[PAD_Y, height / 2, height - PAD_Y].map((y) => (
              <line key={y} x1="0" y1={y} x2={W} y2={y} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          {series.map((s, si) =>
            lines[si].map((pts) => (
              <polyline
                key={pts}
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? "8 6" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}
        </svg>
        {hover !== null && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-line-strong" style={{ left: `${xPct(hover)}%` }} />
            {series.map((s) => {
              const v = s.values[hover];
              return v === null ? null : (
                <span
                  key={s.name}
                  aria-hidden="true"
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
                  style={{ left: `${xPct(hover)}%`, top: yAt(v), background: s.color }}
                />
              );
            })}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-0 z-10 flex flex-col gap-1 rounded-xl bg-ink px-3 py-2.5 text-[13px] whitespace-nowrap text-paper shadow-lg ${
                xPct(hover) > 50 ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5"
              }`}
              style={{ left: `${xPct(hover)}%` }}
            >
              <span className="font-bold">{points[hover]}</span>
              {series.map((s) => (
                <span key={s.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                  <span className="ml-auto pl-3 font-bold">{s.values[hover] === null ? "—" : formatPrice(s.values[hover]!)}</span>
                </span>
              ))}
            </div>
          </>
        )}
        {tags.map(({ s, top }) => (
          <span
            key={s.name}
            aria-hidden="true"
            className="pointer-events-none absolute right-0 rounded-lg px-2 py-1 text-[13px] font-bold"
            style={{ top, background: s.color, color: s.tagText ?? "#12141C" }}
          >
            {s.tag}
          </span>
        ))}
      </div>
      <div className="relative h-5 text-[13px] text-muted">
        {axis.map(({ index, label }) => {
          const align = index === 0 ? "" : index === n - 1 ? "-translate-x-full" : "-translate-x-1/2";
          return (
            <span key={index} className={`absolute top-0 whitespace-nowrap ${align}`} style={{ left: `${xPct(index)}%` }}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
