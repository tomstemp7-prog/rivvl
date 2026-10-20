import type { Metadata } from "next";
import { SignupShell, StepHeading } from "@/components/signup-shell";
import { parseProfile } from "@/lib/profile";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Sign up: your business · Rivl" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = parseProfile(await searchParams);
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
      <BusinessForm initial={profile} />
    </SignupShell>
  );
}
