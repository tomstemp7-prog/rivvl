import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Privacy · Rivl" };

/*
 * DRAFT privacy notice. Bracketed text is undecided and must be filled in, and
 * the whole notice should be reviewed by someone qualified before launch.
 * Keep it in step with what the site actually collects and who processes it.
 */

const h2 = "m-0 font-display text-[26px] font-semibold tracking-[-0.4px] sm:text-[28px]";
const p = "m-0 text-[17px] leading-[1.65] text-body";
const list = "m-0 flex flex-col gap-2 pl-5 text-[17px] leading-[1.6] text-body";

const PROCESSORS = [
  ["Vercel", "Hosts the website and provides cookieless visit statistics", "[CONFIRM REGION]"],
  ["Supabase", "Stores sign-ups, shared prices and register-interest details", "London (UK)"],
  ["Formspree", "Emails us register-interest sign-ups and demo requests", "[CONFIRM: may be outside the UK]"],
  ["postcodes.io", "Turns a postcode into a place and map position", "UK"],
  ["OpenFreeMap", "Supplies the street map tiles", "[CONFIRM REGION]"],
];

export default function PrivacyPage() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto flex max-w-[820px] flex-col gap-10 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-4">
          <p className="m-0 self-start rounded-full bg-data-tint px-3.5 py-2 text-sm font-semibold text-data-dark">Privacy</p>
          <h1 className="m-0 font-display text-[40px] leading-[1.05] font-semibold tracking-[-1.2px] sm:text-[52px]">How Rivl handles your data</h1>
          <p className={p}>
            Rivl helps small businesses see what comparable businesses nearby charge. This notice explains what we collect, why,
            who helps us process it, and your rights. Last updated [DATE].
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>Who we are</h2>
          <p className={p}>
            Rivl is run by [COMPANY NAME], a company registered in [England and Wales] (company number [NUMBER]), at [REGISTERED
            ADDRESS]. We are the data controller for the information described here. Our ICO registration number is [ICO NUMBER].
            Contact us about privacy at [PRIVACY EMAIL].
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>What we collect</h2>
          <ul className={list}>
            <li>
              <b className="text-ink">When you sign up:</b> your business name, type of business, postcode and how far your
              customers travel.
            </li>
            <li>
              <b className="text-ink">Prices you choose to share:</b> the price items you enter, the date, and your confirmation
              that you agreed to share them.
            </li>
            <li>
              <b className="text-ink">When you register interest:</b> your business name, your name (optional), email, phone
              (optional), type of business, postcode (optional) and one headline price (optional, only with your consent).
            </li>
            <li>
              <b className="text-ink">Visit statistics:</b> pages viewed and rough location by country, collected without cookies
              and without identifying you.
            </li>
            <li>
              <b className="text-ink">Public business information:</b> names, locations and published prices of local
              businesses, taken from OpenStreetMap and from each business’s own website or booking page. Every price shows its
              source and the date we checked it.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>How we use it, and our legal basis</h2>
          <ul className={list}>
            <li>
              <b className="text-ink">To provide the service</b> (showing your local market, benchmark and reports): to perform
              our agreement with you.
            </li>
            <li>
              <b className="text-ink">Prices you share</b> are used only inside anonymised area averages, and only where enough
              businesses have shared that we can’t reveal any one of them. They are never shown against your business name. Legal
              basis: your consent, which you can withdraw at any time.
            </li>
            <li>
              <b className="text-ink">Emails about launching near you</b> and your free local price report: your consent. Every
              email lets you unsubscribe.
            </li>
            <li>
              <b className="text-ink">Public business information and visit statistics:</b> our legitimate interest in running
              an accurate local pricing service. Businesses can ask us to correct or remove their details at any time.
            </li>
          </ul>
          <p className={p}>We never sell your data, and we don’t use advertising or tracking cookies.</p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>Who helps us process it</h2>
          <p className={p}>These providers process data on our behalf, under contracts that protect it:</p>
          <div className="overflow-x-auto rounded-[20px] border border-line bg-surface">
            <table className="w-full min-w-[560px] border-collapse text-[15px] text-body-strong">
              <thead>
                <tr className="text-left">
                  <th className="px-5 py-3.5 font-bold">Provider</th>
                  <th className="px-4 py-3.5 font-bold">What for</th>
                  <th className="px-5 py-3.5 font-bold">Where</th>
                </tr>
              </thead>
              <tbody>
                {PROCESSORS.map(([name, what, where]) => (
                  <tr key={name} className="border-t border-line">
                    <th scope="row" className="px-5 py-3.5 text-left font-semibold">{name}</th>
                    <td className="px-4 py-3.5">{what}</td>
                    <td className="px-5 py-3.5">{where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={p}>
            Where a provider processes data outside the UK, we rely on [the UK International Data Transfer Agreement or an
            adequacy decision, TO CONFIRM].
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>How long we keep it</h2>
          <ul className={list}>
            <li>Account and sign-up details: while your account is open, then [PERIOD].</li>
            <li>Shared prices: [PERIOD], or until you withdraw consent.</li>
            <li>Register-interest details: until we launch near you and [PERIOD] after, or until you ask us to delete them.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>Your rights</h2>
          <p className={p}>
            You can ask to see, correct, delete or move your data, object to or restrict how we use it, and withdraw consent at
            any time. Email [PRIVACY EMAIL] and we’ll respond within one month. If you’re unhappy with how we handle your data,
            you can complain to the Information Commissioner’s Office at{" "}
            <a href="https://ico.org.uk" className="font-semibold text-data-dark underline hover:text-ink">
              ico.org.uk
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={h2}>Changes to this notice</h2>
          <p className={p}>
            We’ll update this page if what we collect or who processes it changes, and tell you by email about anything
            significant.
          </p>
        </section>

        <p className="m-0 rounded-2xl bg-sand px-5 py-4 text-[15px] text-body">
          Questions? Email [PRIVACY EMAIL], or{" "}
          <Link href="/#waitlist" className="font-semibold text-data-dark underline hover:text-ink">
            register your interest
          </Link>{" "}
          if you’d like Rivl in your area.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
