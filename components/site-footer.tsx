import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-4 py-10 text-[15px] text-muted sm:px-8">
        <Logo className="text-[22px]" />
        <nav aria-label="Footer" className="flex flex-wrap gap-6 text-body">
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Trial terms</Link>
          <Link href="/contact" className="hover:text-ink">Contact</Link>
        </nav>
        <span>© 2026 Rivl</span>
      </div>
    </footer>
  );
}
