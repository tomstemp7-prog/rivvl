import { publishingStats } from "@/lib/markets";

/**
 * "Most local businesses keep prices offline": how many businesses in a
 * launched town publish prices, per researched sector. Calculated from the
 * research data, so it updates as more businesses are checked.
 */
export async function PublishingStats({ tone = "light" }: { tone?: "light" | "dark" }) {
  const stats = await publishingStats();
  if (!stats || !stats.sectors.length) return null;
  const dark = tone === "dark";
  // Highest share first, so the bars step down.
  const rows = stats.sectors.map((s) => ({ ...s, pct: Math.round((s.published / s.total) * 100) })).sort((a, b) => b.pct - a.pct);
  const lowest = [...rows].sort((a, b) => a.pct - b.pct)[0];
  const checked = new Date(stats.checked).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <div className={`flex flex-col gap-4 ${dark ? "" : "rounded-2xl border border-line bg-surface p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-1.5">
        <p className={`m-0 text-[15px] font-bold ${dark ? "text-paper" : "text-ink"}`}>Most local prices aren’t online</p>
        <p className={`m-0 text-[15px] leading-normal ${dark ? "text-on-dark-2" : "text-body"}`}>
          Only {lowest.pct}% of {lowest.plural} in {stats.town} publish their prices. Prices shared by owners fill the gaps.
        </p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((r, i) => (
          <li key={r.sector} className="flex flex-col gap-1.5">
            <span className={`flex justify-between gap-3 text-sm ${dark ? "text-on-dark" : "text-body-strong"}`}>
              <span className="font-semibold">{r.plural[0].toUpperCase() + r.plural.slice(1)}</span>
              <span>
                {r.published} of {r.total} · <b>{r.pct}%</b>
              </span>
            </span>
            <span aria-hidden="true" className={`h-2 overflow-hidden rounded-full ${dark ? "bg-ink-line" : "bg-sand"}`}>
              <span
                className="block h-full origin-left animate-bar-grow rounded-full bg-accent motion-reduce:animate-none"
                style={{ width: `${r.pct}%`, animationDelay: `${250 + i * 180}ms` }}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className={`m-0 text-xs leading-normal ${dark ? "text-on-dark-muted" : "text-muted"}`}>
        Rivl research of every {listOf(rows.map((r) => r.sector.toLowerCase()))} within {stats.miles} miles of {stats.town} town
        centre, checked {checked}. “Price on request” counts as not published.
      </p>
    </div>
  );
}

/** ["gym", "barber", "nail bar"] → "gym, barber and nail bar". */
function listOf(words: string[]) {
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}
