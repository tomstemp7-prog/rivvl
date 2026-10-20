import Link from "next/link";

/** Same prompt as the market map's limited view. */
export function LimitedBanner({ query, text }: { query: string; text: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-data-tint px-5 py-4 text-data-dark">
      <p className="m-0 text-[15px] font-semibold">{text}</p>
      <Link href={`/signup/prices?${query}`} className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper hover:bg-ink-3">
        Share my prices
      </Link>
    </div>
  );
}
