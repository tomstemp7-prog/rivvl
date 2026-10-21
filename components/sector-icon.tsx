/** A simple line icon for each kind of business (24×24, stroke uses the text colour). */
const PATHS: Record<string, React.ReactNode> = {
  // Dumbbell
  Gym: <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />,
  // Scissors
  "Hair salon": (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
    </>
  ),
  // Comb
  Barber: <path d="M3 7.5h18v3.5H3zM5.5 11v6M9 11v6M12.5 11v6M16 11v6M19.5 11v4" />,
  // Coffee cup with steam
  "Coffee shop": (
    <>
      <path d="M4 9h13v4.5A5.5 5.5 0 0 1 11.5 19h-2A5.5 5.5 0 0 1 4 13.5z" />
      <path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17M8.5 3v3M12.5 3v3" />
    </>
  ),
  // Sparkles
  "Beauty salon": (
    <>
      <path d="M11 3.5 12.8 8 17.5 9.8 12.8 11.6 11 16.2 9.2 11.6 4.5 9.8 9.2 8z" />
      <path d="M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  // Nail polish bottle
  "Nail bar": (
    <>
      <path d="M10 2.5h4v5.5h-4z" />
      <path d="M8.5 8h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
    </>
  ),
  // Lotus flower
  "Yoga and pilates": (
    <path d="M12 4.5c2 2 3 4.4 3 6.9 0 2.4-1 4.4-3 5.9-2-1.5-3-3.5-3-5.9 0-2.5 1-4.9 3-6.9zM12 17.3c-3.2 0-6.7-1.6-8.5-5.1 2.3-.9 4.8-.6 6.6.6M12 17.3c3.2 0 6.7-1.6 8.5-5.1-2.3-.9-4.8-.6-6.6.6M6 20h12" />
  ),
  // Medical cross
  Physio: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
};

export function SectorIcon({ sector, className = "h-6 w-6" }: { sector: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[sector]}
    </svg>
  );
}
