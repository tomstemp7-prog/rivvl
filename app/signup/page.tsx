import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupShell, StepHeading } from "@/components/signup-shell";
import { POSTCODE_SHAPE } from "@/lib/postcode";
import { parseProfile, profileQuery } from "@/lib/profile";
import { launchedTownFor } from "@/lib/towns";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Sign up: your business · Rivl" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const profile = parseProfile(params);
  // Arriving from the home page search outside a launched town: register interest instead. The interest page
  // links back here with demo=1, and returning visitors (who already have a name) aren't redirected.
  const demo = params.demo === "1";
  if (!demo && !profile.name && POSTCODE_SHAPE.test(profile.postcode) && !launchedTownFor(profile.postcode)) {
    redirect(`/interest?${profileQuery({ name: profile.name || undefined, sector: profile.sector, postcode: profile.postcode })}`);
  }
  return (
    <SignupShell
      step={1}
      asideCard={
        <>
          <p className="m-0 text-[15px] font-bold">Your data stays yours</p>
          <p className="m-0 text-[15px] leading-normal text-on-dark-2">
            Prices you share only feed area averages. Rivl never shows them against your name.
          </p>
        </>
      }
    >
      <StepHeading
        step={1}
        title="Tell us about your business"
        intro="We use this to find the businesses your customers compare you with."
      />
      <BusinessForm initial={profile} demo={demo} />
    </SignupShell>
  );
}
