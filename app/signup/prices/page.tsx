import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Fact } from "@/components/building-screen";
import { PublishingStats } from "@/components/publishing-stats";
import { publishingStats } from "@/lib/markets";
import { SignupShell, StepHeading } from "@/components/signup-shell";
import { parseProfile, profileQuery } from "@/lib/profile";
import { CHARGING, itemsFor, pluralFor } from "@/lib/sectors";
import { PricesForm } from "./prices-form";

export const metadata: Metadata = { title: "Sign up: share your prices · Rivl" };

export default async function PricesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = parseProfile(await searchParams);
  if (!profile.name || !profile.postcode) redirect(`/signup?${profileQuery(profile)}`);
  const facts = await buildingFacts(profile.sector);

  return (
    <SignupShell
      step={2}
      doneSummary={`${profile.sector} · ${profile.postcode} · ${profile.radius}`}
      asideCard={
        <>
          <p className="m-0 text-[15px] font-bold">What sharing unlocks</p>
          <ul className="m-0 mt-1.5 flex flex-col gap-2 pl-4.5 text-[15px] leading-[1.45] text-on-dark-2">
            <li>Nearby businesses named on your map</li>
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
      <PricesForm profile={profile} items={itemsFor(profile.sector)} facts={facts} plural={pluralFor(profile.sector)} />
    </SignupShell>
  );
}

/** Facts for the "building your market" screen: Rivl's own research first (the owner's sector leads), then cited UK figures. */
async function buildingFacts(sector: string): Promise<Fact[]> {
  const stats = await publishingStats();
  const checked = stats ? new Date(stats.checked).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : "";
  const local: Fact[] = (stats?.sectors ?? [])
    .toSorted((a, b) => Number(b.sector === sector) - Number(a.sector === sector))
    .map((s) => ({
      figure: `${s.published} in ${s.total}`,
      text: `${s.plural[0].toUpperCase() + s.plural.slice(1)} within ${stats!.miles} miles of ${stats!.town} that publish their prices online.`,
      source: `Rivl research, ${checked}`,
    }));
  return [
    ...local,
    { figure: "£69.81 vs £35.52", text: "Average monthly gym membership in London vs Yorkshire and the Humber.", source: "Leisure DB, State of the UK Fitness Industry 2023" },
    { figure: "£9 vs £17", text: "Average men’s haircut in Stoke-on-Trent vs Glasgow.", source: "Ripe Hair & Beauty analysis, 2025" },
    { figure: "1 in 3", text: "UK firms say what similar businesses charge is ‘very important’ when setting prices.", source: "Bank of England price-setting survey, 2008" },
  ];
}
