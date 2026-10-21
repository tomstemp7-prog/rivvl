import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublishingStats } from "@/components/publishing-stats";
import { SignupShell, StepHeading } from "@/components/signup-shell";
import { parseProfile, profileQuery } from "@/lib/profile";
import { CHARGING, itemsFor, pluralFor } from "@/lib/sectors";
import { PricesForm } from "./prices-form";

export const metadata: Metadata = { title: "Sign up: share your prices · Rivl" };

export default async function PricesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = parseProfile(await searchParams);
  if (!profile.name || !profile.postcode) redirect(`/signup?${profileQuery(profile)}`);

  return (
    <SignupShell
      step={2}
      doneSummary={`${profile.sector} · ${profile.postcode} · ${profile.radius}`}
      asideCard={
        <>
          <p className="m-0 text-[15px] font-bold">What sharing unlocks</p>
          <ul className="m-0 mt-1.5 flex flex-col gap-2 pl-4.5 text-[15px] leading-[1.45] text-on-dark-2">
            <li>Named rivals on your map</li>
            <li>Your position on every price item</li>
            <li>Your first monthly report</li>
          </ul>
          <hr className="my-3 border-0 border-t border-ink-line" />
          <PublishingStats tone="dark" />
        </>
      }
    >
      <StepHeading
        step={2}
        title="Share your prices, see the full picture"
        intro={`${CHARGING[profile.sector] ?? ""} These are the standard items we compare for ${pluralFor(profile.sector)}. Fill in what you offer; leave the rest blank.`}
      />
      <PricesForm profile={profile} items={itemsFor(profile.sector)} />
    </SignupShell>
  );
}
