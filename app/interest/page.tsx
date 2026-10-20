import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WaitlistForm } from "@/components/waitlist-form";
import { placeFor } from "@/lib/postcode";
import { profileQuery } from "@/lib/profile";
import { pluralFor, SECTORS } from "@/lib/sectors";
import { LAUNCHED_TOWNS } from "@/lib/towns";

export const metadata: Metadata = { title: "Register interest · Rivl" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Where postcodes outside a launched town land: register interest, or explore the sample demo. */
export default async function InterestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const sectorParam = first(params.sector);
  const sector = SECTORS.some((s) => s.label === sectorParam) ? sectorParam : "Gym";
  const postcode = first(params.postcode).trim().toUpperCase();
  const business = first(params.name);
  const place = postcode ? await placeFor(postcode) : null;
  const town = place?.district || null;
  const launched = LAUNCHED_TOWNS.map((t) => t.name).join(" and ");
  const demoQuery = profileQuery({ sector, postcode: place?.postcode ?? postcode, name: business || undefined });

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-12 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
          <p className="m-0 self-start rounded-full bg-data-tint px-3.5 py-2 text-sm font-semibold text-data-dark">
            {postcode ? `${place?.postcode ?? postcode}${town ? `, ${town}` : ""}` : "Coming to your area"}
          </p>
          <h1 className="m-0 font-display text-[40px] leading-[1.05] font-semibold tracking-[-1.2px] sm:text-[52px]">
            {town ? `Rivl isn’t in ${town} yet.` : "Rivl isn’t in your area yet."}
          </h1>
          <p className="m-0 text-lg leading-[1.55] text-body">
            We’re live in {launched} first, with real local businesses and their published prices. Register your interest and
            we’ll tell you as soon as {town ?? "your area"} goes live. The more {pluralFor(sector)} that sign up, the sooner we
            launch there.
          </p>
          <ul className="m-0 flex flex-col gap-3 pl-5 text-base leading-normal text-body-strong">
            <li>First access when we launch near you</li>
            <li>A free local price report if you share a price</li>
            <li>Your prices only ever appear in anonymised averages</li>
          </ul>
          <p className="m-0 text-[15px] text-muted">
            Want to see how it works first?{" "}
            <Link href={`/signup?${demoQuery}&demo=1`} className="font-bold text-data-dark underline hover:text-ink">
              Explore the demo with sample data
            </Link>
          </p>
        </div>
        <div className="min-w-0 flex-[1.4_1_480px] rounded-[28px] border border-line bg-surface px-5 py-7 sm:p-10">
          <h2 className="m-0 mb-6 font-display text-[28px] font-semibold tracking-[-0.5px]">Register interest</h2>
          <WaitlistForm initial={{ sector, postcode: place?.postcode ?? postcode, business }} source="out-of-area" town={town ?? undefined} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
