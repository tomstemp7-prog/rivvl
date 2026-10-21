import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currentUser } from "@/lib/auth";
import { authConfigured } from "@/lib/auth-config";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Rivl" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNext(first(params.next));
  if (await currentUser()) redirect(next);

  return (
    <div>
      <SiteHeader current="/dashboard" />
      <main className="mx-auto flex max-w-[480px] flex-col gap-6 px-4 pt-12 pb-24 sm:pt-16">
        <h1 className="m-0 font-display text-[40px] leading-[1.05] font-semibold tracking-[-1.2px]">Log in to Rivl</h1>
        <p className="m-0 text-lg leading-[1.55] text-body">
          We’ll email you a one-time code. Use the email you signed up with and your business will be waiting.
        </p>
        {first(params.error) === "link" && (
          <p role="alert" className="m-0 rounded-xl bg-accent-tint px-4 py-3 text-[15px] font-semibold text-accent-dark">
            That login link has expired or was already used. Enter your email for a new code.
          </p>
        )}
        {authConfigured ? (
          <LoginForm next={next} />
        ) : (
          <p className="m-0 rounded-xl bg-sand px-4 py-3 text-[15px] text-body">Logins aren’t switched on in this environment.</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
