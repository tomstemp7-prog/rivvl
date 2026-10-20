"use client";

import { useState } from "react";

export function WatchButton() {
  const [watching, setWatching] = useState(true);
  return (
    <button
      type="button"
      aria-pressed={watching}
      onClick={() => setWatching(!watching)}
      className={`min-h-12 cursor-pointer rounded-xl border-[1.5px] border-ink px-5 text-[15px] font-bold ${
        watching ? "bg-ink text-paper hover:bg-ink-3" : "bg-surface text-ink hover:bg-paper"
      }`}
    >
      {watching ? "Watching this rival" : "Watch this rival"}
    </button>
  );
}
