import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Pricing · Rivl" };

const PLANS = [
  {
    name: "Free",
    tagline: "For a first look at your area",
    price: "£0",
    features: ["Area low, median and high for your sector", "Quarterly area snapshot by email", "Requires sharing your own prices"],
    cta: { label: "Start free", href: "/signup" },
  },
  {
    name: "Pro",
    tagline: "For owners who review prices seriously",
    price: "[£29]",
    per: "/month",
    badge: "Most popular",
    dark: true,
    features: [
      "Nearby businesses named on your map",
      "Full benchmark across every price item",
      "12-month price history for each business",
      "Monthly market report and quarterly review",
    ],
    cta: { label: "Try Pro", href: "/signup" },
  },
  {
    name: "Multi-site",
    tagline: "For groups and franchises",
    price: "[£__]",
    per: "/month",
    features: ["Everything in Pro, for every location", "Custom areas and site comparisons", "Team access and exports", "API access"],
    cta: { label: "Talk to us", href: "/#waitlist" },
  },
];

const NO = "–";
const COMPARE = [
  ["Area low, median and high", "Yes", "Yes", "Yes"],
  ["Businesses named on the map", NO, "Yes", "Yes"],
  ["Price history", NO, "12 months", "Full"],
  ["Reports", "Quarterly snapshot", "Monthly + quarterly", "Monthly + quarterly"],
  ["Locations", "1", "1", "[Up to __]"],
  ["API and exports", NO, NO, "Yes"],
];

const FAQS = [
  ["Why do I need to share my prices on Free?", "Shared prices keep the benchmark accurate for everyone. They only ever appear in area averages."],
  ["Can I cancel any time?", "[CONFIRM TERMS] Pro is planned as a monthly rolling plan."],
  ["Is VAT included?", "[CONFIRM] Prices shown exclude VAT."],
];

const h2 = "m-0 font-display text-[32px] font-semibold tracking-[-0.8px] sm:text-4xl";

export default function PricingPage() {
  return (
    <div>
      <SiteHeader current="/pricing" />

      <section className="mx-auto flex max-w-[1240px] flex-col items-center gap-5 px-4 pt-14 pb-12 text-center sm:px-8 sm:pt-18">
        <p className="m-0 rounded-full bg-data-tint px-3.5 py-2 text-sm font-semibold text-data-dark">Pricing</p>
        <h1 className="m-0 max-w-[820px] font-display text-[44px] leading-[1.05] font-semibold tracking-[-1.8px] sm:text-6xl">
          Start free. Upgrade when Rivl pays for itself.
        </h1>
        <p className="m-0 max-w-[640px] text-[19px] leading-[1.55] text-body">
          One well-judged price rise could cover a year of Pro. Prices shown are placeholders while we
          test them.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-stretch gap-5 px-4 pt-6 pb-22 sm:px-8">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-5 rounded-[28px] p-7 sm:p-9 ${
              plan.dark ? "bg-ink text-paper shadow-[0_24px_48px_rgba(18,20,28,0.18)]" : "border border-line bg-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <h2 className="m-0 font-display text-[26px] font-semibold">{plan.name}</h2>
                <p className={`m-0 text-[15px] ${plan.dark ? "text-on-dark-muted" : "text-muted"}`}>{plan.tagline}</p>
              </div>
              {plan.badge && (
                <span className="rounded-full bg-accent px-2.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-ink">{plan.badge}</span>
              )}
            </div>
            <p className="m-0 font-display text-[56px] font-semibold tracking-[-1.5px]">
              {plan.price}
              {plan.per && (
                <span className={`text-xl tracking-normal ${plan.dark ? "text-on-dark-muted" : "text-muted"}`}>{plan.per}</span>
              )}
            </p>
            <ul className={`m-0 flex flex-col gap-3 pl-5 text-base leading-[1.45] ${plan.dark ? "text-on-dark" : "text-body-strong"}`}>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="flex-1" />
            <Link
              href={plan.cta.href}
              className={`flex min-h-[52px] items-center justify-center rounded-[14px] font-bold ${
                plan.dark ? "bg-accent text-ink hover:brightness-95" : "border-[1.5px] border-ink text-ink hover:bg-paper"
              }`}
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </section>

      <section className="mx-auto flex max-w-[1040px] flex-col gap-6 px-4 pb-22 sm:px-8">
        <h2 className={h2}>Compare plans</h2>
        <div className="overflow-x-auto rounded-[20px] border border-line bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-base">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-4.5 font-bold">Feature</th>
                <th className="px-4 py-4.5 font-bold">Free</th>
                <th className="px-4 py-4.5 font-bold">Pro</th>
                <th className="px-4 py-4.5 font-bold">Multi-site</th>
              </tr>
            </thead>
            <tbody className="text-body-strong">
              {COMPARE.map(([feature, ...cells]) => (
                <tr key={feature} className="border-t border-line">
                  <th scope="row" className="px-6 py-4 text-left font-normal">{feature}</th>
                  {cells.map((c, i) => (
                    <td key={i} className={`p-4 ${c === NO ? "text-muted" : ""}`}>
                      {c === NO ? <span aria-label="Not included">{c}</span> : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1040px] flex-col px-4 pb-26 sm:px-8">
        <h2 className={`${h2} mb-6`}>Billing questions</h2>
        {FAQS.map(([q, a]) => (
          <details key={q} className="border-t border-line-faq py-5 last:border-b">
            <summary className="cursor-pointer text-lg font-semibold">{q}</summary>
            <p className="mt-3 mb-0 text-base leading-[1.55] text-body">{a}</p>
          </details>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
