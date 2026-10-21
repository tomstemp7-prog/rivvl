import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Trial terms · Rivl" };

/*
 * DRAFT trial terms. Bracketed text is undecided; have the whole page reviewed
 * by someone qualified before inviting testers.
 */

const h2 = "m-0 font-display text-[26px] font-semibold tracking-[-0.4px] sm:text-[28px]";
const p = "m-0 text-[17px] leading-[1.65] text-body";
const list = "m-0 flex flex-col gap-2 pl-5 text-[17px] leading-[1.6] text-body";

export default function TermsPage() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto flex max-w-[820px] flex-col gap-10 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-4">
          <p className="m-0 self-start rounded-full bg-data-tint px-3.5 py-2 text-sm font-semibold text-data-dark">Trial terms</p>
          <h1 className="m-0 font-display text-[40px] leading-[1.05] font-semibold tracking-[-1.2px] sm:text-[52px]">The Rivl trial</h1>
          <p className={p}>
            Thanks for helping us test Rivl. These terms cover the trial period. They’re written to be read, so if anything is
            unclear, <Link href="/contact" className="font-semibold text-data-dark underline hover:text-ink">ask us</Link>. Last
            updated [DATE].
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>What the trial is</h2>
          <ul className={list}>
            <li>Rivl is provided by [COMPANY NAME] free of charge from [START DATE] to [END DATE].</li>
            <li>There’s no obligation to buy anything, and you can stop at any time.</li>
            <li>Before the trial ends we’ll tell you what Rivl will cost afterwards. You won’t be charged unless you choose to sign up.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>About the prices you see</h2>
          <ul className={list}>
            <li>
              Other businesses’ prices come from each business’s own website or booking page, with the source and the date we checked.
              Businesses change prices, so a price may be out of date: please check before relying on it.
            </li>
            <li>Rivl is information to help your decisions, not advice. Pricing decisions remain yours.</li>
            <li>If a price looks wrong, use “Is a price here wrong or out of date?” on that business’s page and we’ll re-check it.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>The prices you share</h2>
          <ul className={list}>
            <li>Only share prices you’re happy to share; you confirm they’re your current published prices.</li>
            <li>
              Shared prices are only used inside anonymised area averages, and only where enough businesses have shared that no
              single price can be worked out. They’re never shown against your name.
            </li>
            <li>You can ask us to delete them at any time. See the <Link href="/privacy" className="font-semibold text-data-dark underline hover:text-ink">privacy notice</Link>.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>Your part</h2>
          <ul className={list}>
            <li>Use Rivl for your own business, and don’t copy or resell the data.</li>
            <li>Tell us what’s useful and what isn’t: the Feedback button on every dashboard page comes straight to us.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>The small print</h2>
          <ul className={list}>
            <li>Rivl is a trial service, so things may change, break or pause while we improve it.</li>
            <li>To the extent the law allows, [COMPANY NAME] isn’t liable for decisions made using Rivl’s information. [CONFIRM WORDING]</li>
            <li>These terms are governed by the law of [England and Wales].</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
