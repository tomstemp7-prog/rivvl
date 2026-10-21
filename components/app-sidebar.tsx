import Link from "next/link";
import { signOut } from "@/app/auth-actions";
import { Logo } from "./logo";

const NAV = [
  {
    href: "/dashboard",
    label: "Market map",
    icon: (
      <>
        <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
  },
  { href: "/dashboard/benchmark", label: "Benchmark", icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  {
    href: "/dashboard/competitors",
    label: "Competitors",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.7-4.9-4-5.7" />
      </>
    ),
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M9 12h7M9 16h7" />
      </>
    ),
  },
  {
    href: "/signup/prices",
    label: "Your prices",
    icon: (
      <>
        <path d="M20 12l-8 8-9-9V3h8z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </>
    ),
  },
];

type Props = {
  current: string;
  business: string;
  subtitle: string;
  query: string;
  /** The signed-in viewer owns this business: "Your prices" edits it rather than restarting sign-up. */
  owned?: boolean;
  /** The signed-in viewer's email, shown with a log-out button. */
  account?: string;
};

export function AppSidebar({ current, business, subtitle, query, owned = false, account }: Props) {
  return (
    <aside className="flex min-w-0 flex-[1_1_240px] flex-col gap-8 bg-ink px-5 py-7 text-paper lg:max-w-[280px] print:hidden">
      <div className="px-3">
        <Logo dark className="text-[26px]" />
      </div>
      <nav aria-label="App" className="flex flex-col gap-1 text-[15px] font-semibold">
        {NAV.map((item) => {
          const href = item.href === "/signup/prices" && owned ? "/dashboard/prices" : item.href;
          const active = href === current;
          return (
            <Link
              key={item.href}
              href={`${href}?${query}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 ${
                active ? "bg-ink-3 text-white" : "text-on-dark-2 hover:bg-ink-2 hover:text-white"
              }`}
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={active ? "#FF6A3D" : "currentColor"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      <div className="flex flex-col gap-1 rounded-2xl border border-ink-line bg-ink-2 p-4">
        <span className="text-[15px] font-bold">{business}</span>
        <span className="text-[13px] text-on-dark-muted">{subtitle}</span>
        {account && (
          <form action={signOut} className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink-line pt-3">
            <span className="min-w-0 truncate text-[13px] text-on-dark-2">{account}</span>
            <button type="submit" className="cursor-pointer text-[13px] font-bold text-data-light hover:text-white">
              Log out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
