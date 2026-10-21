import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardMain, DashboardShell } from "@/components/dashboard-shell";
import { currentUser } from "@/lib/auth";
import { loadSite, ownedSiteId } from "@/lib/sites";
import { CHARGING, itemsFor, RADII } from "@/lib/sectors";
import { EditPricesForm } from "./edit-prices-form";

export const metadata: Metadata = { title: "Your prices · Rivl" };

// Depends on who is logged in, so never prerender it.
export const dynamic = "force-dynamic";

/** Owners edit the prices they share and their catchment radius. Logged-in owners only. */
export default async function YourPricesPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard/prices");
  const siteId = await ownedSiteId(user.id);
  const saved = siteId ? await loadSite(siteId) : null;

  if (!saved) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center gap-5 px-4">
        <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">No business linked yet</h1>
        <p className="m-0 text-lg leading-normal text-body">
          You’re logged in as <b>{user.email}</b>, but no business on Rivl uses that email. Sign up with it and your business will be
          linked to this login.
        </p>
        <Link href="/signup" className="self-start rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-ink-3">
          Sign up your business
        </Link>
      </main>
    );
  }

  const profile = { ...saved.profile, owned: true };
  return (
    <DashboardShell current="/dashboard/prices" profile={profile}>
      <main className={dashboardMain}>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-sm font-semibold text-muted">
            {profile.name} · {profile.sector} · {profile.postcode}
          </p>
          <h1 className="m-0 font-display text-4xl font-semibold tracking-[-0.8px]">Your prices</h1>
          <p className="m-0 max-w-[720px] text-[17px] leading-normal text-body">
            {CHARGING[profile.sector]} Keep these up to date and your benchmark stays accurate. They’re only ever used in anonymised
            area averages.
          </p>
        </div>
        <EditPricesForm items={itemsFor(profile.sector)} prices={profile.prices} radius={profile.radius} radii={[...RADII]} />
      </main>
    </DashboardShell>
  );
}
