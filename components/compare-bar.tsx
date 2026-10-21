"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * The distance and service switches at the top of dashboard pages: rows of
 * buttons you can flick between (they scroll sideways on a phone), pinned
 * to the top while the page scrolls. Each option is either a link (server
 * pages) or a button (pages that switch in place).
 */
export type PillOption = { value: string; label: string; href?: string };

type Group = { label: string; options: PillOption[]; value: string; onChange?: (value: string) => void };

export function CompareBar({ groups }: { groups: Group[] }) {
  const bar = useRef<HTMLDivElement>(null);
  const values = groups.map((g) => g.value).join("|");
  // Keep each row's selected option in view; a row resets to its start when a link loads the page.
  useEffect(() => {
    bar.current?.querySelectorAll<HTMLElement>("[aria-current], [aria-pressed=true]").forEach((el) => {
      const row = el.parentElement!;
      row.scrollLeft = el.offsetLeft - row.offsetLeft - (row.clientWidth - el.offsetWidth) / 2;
    });
  }, [values]);

  return (
    <div ref={bar} className="sticky top-0 z-30 -mx-4 flex flex-col gap-2.5 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-10 sm:px-10 print:hidden">
      {groups.map((g) => (
        <div key={g.label} role="group" aria-label={g.label} className="flex min-w-0 items-center gap-3">
          <span className="w-16 flex-none text-xs font-bold text-muted">{g.label}</span>
          <div className="-my-1 flex min-w-0 gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
            {g.options.map((o) => {
              const on = o.value === g.value;
              const cls = `flex min-h-10 flex-none cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-bold whitespace-nowrap ${
                on ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink hover:border-ink"
              }`;
              return o.href ? (
                <Link key={o.value} href={o.href} scroll={false} aria-current={on || undefined} className={cls}>
                  {o.label}
                </Link>
              ) : (
                <button key={o.value} type="button" aria-pressed={on} onClick={() => g.onChange?.(o.value)} className={cls}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
