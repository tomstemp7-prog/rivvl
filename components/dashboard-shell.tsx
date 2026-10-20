import { profileQuery, type Profile } from "@/lib/profile";
import { AppSidebar } from "./app-sidebar";

/** Sidebar plus page content for every logged-in page. Children supply their own <main>. */
export function DashboardShell({ current, profile, children }: { current: string; profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <AppSidebar
        current={current}
        business={profile.name}
        subtitle={`${profile.sector} · ${profile.postcode} · ${profile.shared ? "Free" : "Limited"}`}
        query={profileQuery(profile)}
      />
      {children}
    </div>
  );
}

export const dashboardMain = "flex min-w-0 flex-[999_1_640px] flex-col gap-6 px-4 pt-8 pb-12 sm:px-10";
