import Link from "next/link";
import { profileQuery, type Profile } from "@/lib/profile";
import { AppSidebar } from "./app-sidebar";

/** Sidebar plus page content for every logged-in page. Children supply their own <main>. */
export function DashboardShell({ current, profile, children }: { current: string; profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <p className="m-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-accent px-4 py-2.5 text-center text-sm font-semibold text-ink print:hidden">
        This is a demo with sample prices.
        <Link href="/#waitlist" className="font-bold underline underline-offset-2 hover:no-underline">
          Join the waitlist for your area
        </Link>
      </p>
      <div className="flex flex-1 flex-wrap">
        <AppSidebar
          current={current}
          business={profile.name}
          subtitle={`${profile.sector} · ${profile.postcode} · ${profile.shared ? "Free" : "Limited"}`}
          query={profileQuery(profile)}
        />
        {children}
      </div>
    </div>
  );
}

export const dashboardMain = "flex min-w-0 flex-[999_1_640px] flex-col gap-6 px-4 pt-8 pb-12 sm:px-10";
