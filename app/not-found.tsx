import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center gap-6 px-8">
      <Logo />
      <h1 className="font-display text-5xl font-semibold tracking-[-1.2px]">This page is on its way.</h1>
      <p className="text-lg text-body">We’re still building this part of Rivl.</p>
      <Link href="/" className="self-start rounded-full bg-ink px-6 py-3 font-semibold text-paper">
        Back to home
      </Link>
    </main>
  );
}
