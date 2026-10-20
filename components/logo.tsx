import Link from "next/link";

export function Logo({ dark = false, className = "text-[28px]" }: { dark?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display font-bold tracking-[-0.5px] no-underline ${dark ? "text-paper" : "text-ink"} ${className}`}
    >
      Rivl<span className="text-accent">.</span>
    </Link>
  );
}
