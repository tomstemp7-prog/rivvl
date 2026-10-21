import Link from "next/link";
import { loginLive } from "@/lib/auth-config";
import { Logo } from "./logo";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#sectors", label: "Sectors" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#demo", label: "Get in touch" },
  // "Local insights" until logins go live (NEXT_PUBLIC_LOGIN_LIVE=1, once email is set up).
  loginLive ? { href: "/login", label: "Log in" } : { href: "/dashboard", label: "Local insights" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
      <Logo />
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-3 text-base font-medium">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === current ? "page" : undefined}
            className="hover:text-data-dark aria-[current=page]:underline aria-[current=page]:underline-offset-[6px]"
          >
            {item.label}
          </Link>
        ))}
        <Link href="/signup" className="rounded-full bg-ink px-5 py-3 font-semibold text-paper hover:bg-ink-3">
          Get started free
        </Link>
      </nav>
    </header>
  );
}
