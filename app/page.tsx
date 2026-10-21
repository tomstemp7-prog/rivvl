import Form from "next/form";
import Link from "next/link";
import { SectorIcon } from "@/components/sector-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HomeMapTour } from "@/components/home-map-tour";
import { WaitlistForm } from "@/components/waitlist-form";
import { homeTour } from "@/lib/markets";
import { SECTORS } from "@/lib/sectors";

const HOME_SECTORS = SECTORS.slice(0, 5);

const STATS = [
  {
    figure: "£69.81 vs £35.52",
    text: "Average monthly gym membership in London vs Yorkshire and the Humber.",
    source: "Leisure DB, State of the UK Fitness Industry 2023",
    dark: true,
  },
  {
    figure: "£9 vs £17",
    text: "Average men’s haircut in Stoke-on-Trent vs Glasgow.",
    source: "Ripe Hair & Beauty analysis, 2025",
  },
  {
    figure: "1 in 3",
    text: "UK firms say what similar businesses charge is ‘very important’ when setting prices.",
    source: "Bank of England price-setting survey, 2008",
  },
];

const STEPS = [
  {
    title: "Tell us your business",
    text: "Choose your sector, enter your postcode and how far your customers travel. Rivl finds the businesses your customers compare you with.",
  },
  {
    title: "See your local market",
    text: "A map of the businesses near you, the prices they publish for the same items, and where you sit against the area low, median and high.",
  },
  {
    title: "Get a monthly report",
    text: "Who changed price, who opened nearby, and how your position moved, in your inbox every month with a quarterly review.",
  },
];

const USE_CASES = [
  ["Annual price review.", "Raise prices with evidence before costs force your hand."],
  ["New service.", "Price a new class, treatment or menu item against businesses nearby."],
  ["Second site.", "Compare price levels across postcodes before you expand."],
  ["Someone new nearby.", "See their prices and how the local median shifts."],
];

const BENCHMARK = [
  ["Monthly membership", "£39", "£24.99", "£42", "£80"],
  ["Off-peak membership", "£29", "£19.99", "£30", "£60"],
  ["Day pass", "£10", "£6", "£10", "£15"],
  ["PT session (1 hour)", "£40", "£30", "£42", "£60"],
];

const DATA_POINTS = [
  ["Public prices", "Collected from websites, menus and booking pages, timestamped and mapped."],
  ["Owner-shared prices", "Shared by owners to fill the gaps where prices aren’t online. Only ever used in area averages."],
  ["Like for like", "Every price is matched to a standard item for its sector, with what’s included."],
  ["Coming later", "Link your booking system so your prices stay up to date without retyping them."],
];

const FAQS = [
  [
    "Where does the data come from?",
    "Prices each business publishes on its own website or booking page, with the source and date, plus prices owners choose to share with Rivl. Not every business publishes its prices, so some show as “not published”.",
  ],
  [
    "Will other businesses see my prices?",
    "Prices you share only feed area averages. Rivl never shows your shared prices against your name.",
  ],
  [
    "How often is it updated?",
    "We check published prices by hand for now and show the date each one was checked. We’re starting monthly re-checks and reports in November 2026.",
  ],
  [
    "Which areas do you cover?",
    "We’re starting with Maidenhead and adding areas sector by sector. Register your interest to hear when yours is live.",
  ],
];

const MAP_PINS = [
  { price: "£34", left: "13%", top: "30%" },
  { price: "£45", left: "63%", top: "25%" },
  { price: "£29", left: "30%", top: "58%" },
  { price: "£55", left: "72%", top: "50%" },
];

const h2 = "m-0 font-display text-4xl sm:text-5xl leading-[1.08] tracking-[-1.2px] font-semibold";
const card = "flex flex-col rounded-3xl border border-line bg-surface p-8";

// The map tour reads the town's data (cached for five minutes); rebuild the page hourly.
export const revalidate = 3600;

export default async function Home() {
  const tour = await homeTour();
  return (
    <div>
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-14 px-4 pt-14 pb-24 sm:px-8">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-7">
          <p className="m-0 self-start rounded-full bg-data-tint px-3.5 py-2 text-sm font-semibold text-data-dark">
            Local pricing intelligence for small businesses
          </p>
          <h1 className="m-0 font-display text-5xl leading-[1.02] font-semibold tracking-[-2px] sm:text-[68px]">
            Know what businesses near you charge.
          </h1>
          <p className="m-0 max-w-[540px] text-xl leading-[1.55] text-body">
            Pick your sector, enter your postcode and see what comparable businesses nearby charge, where you sit, and
            how local prices move month to month.
          </p>
          <Form
            action="/signup"
            aria-label="Find your local market"
            className="flex flex-wrap gap-2.5 rounded-[20px] border border-line bg-surface p-2.5 shadow-[0_12px_32px_rgba(18,20,28,0.08)]"
          >
            <label className="flex min-w-0 flex-[1_1_150px] flex-col gap-1 px-3.5 py-2 text-[13px] font-semibold text-muted">
              Business type
              <select name="sector" className="w-full min-w-0 bg-transparent p-0 text-[17px] font-medium text-ink">
                {HOME_SECTORS.map((s) => (
                  <option key={s.label}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-[1_1_150px] flex-col gap-1 border-line px-3.5 py-2 text-[13px] font-semibold text-muted sm:border-l">
              Postcode
              <input
                name="postcode"
                type="text"
                placeholder="e.g. SL6 7AA"
                className="w-full min-w-0 bg-transparent p-0 text-[17px] font-medium text-ink outline-offset-4"
              />
            </label>
            <button
              type="submit"
              className="flex min-h-[52px] flex-none cursor-pointer items-center justify-center rounded-[14px] bg-accent px-6.5 text-base font-bold text-ink hover:brightness-95"
            >
              See my local market
            </button>
          </Form>
          <p className="m-0 text-sm text-muted">Free to start. Share your own prices to unlock more detail.</p>
        </div>

        {tour?.stops.length ? (
          <HomeMapTour town={tour.town} centre={tour.centre} miles={tour.miles} stops={tour.stops} dots={tour.dots} />
        ) : (
          <div className="relative h-[520px] min-w-0 flex-[1_1_460px] overflow-hidden rounded-[28px] bg-ink">
            <svg aria-hidden="true" viewBox="0 0 560 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              <path d="M-20 400 C 120 350, 220 470, 360 420 S 520 330, 600 360" stroke="#2E5BFF" strokeOpacity="0.35" strokeWidth="30" fill="none" />
              <g stroke="#232735" strokeWidth="5" fill="none">
                <path d="M0 250 L560 230" />
                <path d="M190 0 L215 520" />
                <path d="M400 0 L385 520" />
              </g>
              <g stroke="#2B2F3D" strokeWidth="14" fill="none" strokeLinecap="round">
                <path d="M70 0 L130 520" />
                <path d="M0 160 L560 120" />
                <path d="M0 330 L560 300" />
                <path d="M300 0 L280 520" />
                <path d="M490 0 L520 520" />
              </g>
              <circle cx="290" cy="270" r="150" fill="#2E5BFF" fillOpacity="0.08" stroke="#2E5BFF" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="8 8" />
              <g fill="#FF6A3D" stroke="#12141C" strokeWidth="3">
                <circle cx="160" cy="200" r="10" />
                <circle cx="390" cy="170" r="10" />
                <circle cx="230" cy="380" r="10" />
                <circle cx="420" cy="330" r="10" />
                <circle cx="340" cy="420" r="10" />
              </g>
              <circle cx="290" cy="270" r="14" fill="#2E5BFF" stroke="#F6F3EC" strokeWidth="4" />
            </svg>
            {MAP_PINS.map((p) => (
              <p key={p.price} className="absolute m-0 rounded-[10px] bg-paper px-3 py-1.5 text-[15px] font-bold" style={{ left: p.left, top: p.top }}>
                {p.price}
              </p>
            ))}
            <p className="absolute top-[46%] left-[49%] m-0 rounded-[10px] bg-data px-3 py-1.5 text-[15px] font-bold text-white">
              You · £39
            </p>
            <div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-surface px-5 py-4.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-muted">Gyms within 3 miles · monthly membership</span>
                <span className="font-display text-2xl font-semibold">Area median £42</span>
              </div>
              <span className="rounded-full bg-accent-tint px-3 py-2 text-sm font-bold whitespace-nowrap text-accent-dark">You’re £3 below median</span>
            </div>
          </div>
        )}
      </section>

      {/* Built for */}
      <section id="sectors" aria-labelledby="built-for" className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-4 px-4 py-6 sm:flex-nowrap sm:px-8">
          <p id="built-for" className="eyebrow flex-none text-muted">
            Built for
          </p>
          {/* A ribbon that scrolls on a loop: two copies of the list slide left by half the track. Hover or focus pauses it;
              reduced-motion users get one still, wrapped list. */}
          <div className="group min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)] motion-reduce:[mask-image:none]">
            <ul className="m-0 flex w-max animate-marquee list-none p-0 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:gap-y-3">
              {[0, 1].map((copy) =>
                SECTORS.map((s) => (
                  <li key={`${copy}-${s.label}`} aria-hidden={copy === 1 || undefined} className={`flex-none pr-3 ${copy === 1 ? "motion-reduce:hidden" : ""}`}>
                    <Link
                      href={`/signup?sector=${encodeURIComponent(s.label)}`}
                      tabIndex={copy === 1 ? -1 : undefined}
                      className="flex items-center gap-2.5 rounded-full border border-line bg-paper py-2 pr-5 pl-2 text-[17px] font-semibold whitespace-nowrap text-ink hover:border-ink"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-tint text-accent-dark">
                        <SectorIcon sector={s.label} className="h-5 w-5" />
                      </span>
                      {s.heading}
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Why local */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-12 px-4 pt-28 pb-12 sm:px-8">
        <div className="flex max-w-[760px] flex-col gap-4">
          <p className="eyebrow text-data-dark">Why local matters</p>
          <h2 className={h2}>National averages hide what your customers actually compare.</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {STATS.map((s) => (
            <div key={s.figure} className={s.dark ? "flex flex-col gap-3 rounded-3xl bg-ink p-8 text-paper" : `${card} gap-3`}>
              <p className={`m-0 font-display text-[44px] leading-tight font-semibold tracking-[-1px] lg:text-[52px] ${s.dark ? "text-accent" : "text-data-dark"}`}>
                {s.figure}
              </p>
              <p className={`m-0 text-[17px] leading-normal ${s.dark ? "text-on-dark" : "text-body"}`}>{s.text}</p>
              <p className={`m-0 text-[13px] ${s.dark ? "text-on-dark-muted" : "text-muted"}`}>{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-12 px-4 py-24 sm:px-8">
        <div className="flex max-w-[760px] flex-col gap-4">
          <p className="eyebrow text-data-dark">How it works</p>
          <h2 className={h2}>From postcode to pricing decision in three steps.</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className={`${card} gap-4`}>
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-[14px] font-display text-xl font-bold ${
                  i === 2 ? "bg-accent text-ink" : "bg-ink text-paper"
                }`}
              >
                {i + 1}
              </span>
              <h3 className="m-0 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="m-0 text-[17px] leading-[1.55] text-body">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Decisions */}
      <section className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-14 px-4 py-26 sm:px-8">
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-5">
            <p className="eyebrow text-accent">Decisions, not just data</p>
            <h2 className={`${h2} text-paper`}>Price with confidence when it counts.</h2>
            <ul className="m-0 flex list-none flex-col gap-4.5 p-0 text-[17px] leading-normal text-on-dark">
              {USE_CASES.map(([title, text]) => (
                <li key={title}>
                  <strong className="text-paper">{title}</strong> {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4 rounded-3xl border border-ink-line bg-ink-2 p-7">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-base font-bold">Your benchmark</span>
              <span className="text-sm text-on-dark-muted">7 gyms within 3 miles · illustrative</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-right text-on-dark-muted">
                    <th className="py-2.5 text-left font-semibold">Price item</th>
                    <th className="py-2.5 font-semibold text-data-light">You</th>
                    <th className="py-2.5 font-semibold">Low</th>
                    <th className="py-2.5 font-semibold">Median</th>
                    <th className="py-2.5 font-semibold">High</th>
                  </tr>
                </thead>
                <tbody className="text-right">
                  {BENCHMARK.map(([item, you, low, median, high]) => (
                    <tr key={item} className="border-t border-ink-line">
                      <td className="py-3.5 text-left">{item}</td>
                      <td className="font-bold text-data-light">{you}</td>
                      <td>{low}</td>
                      <td>{median}</td>
                      <td>{high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Give to get */}
      <section className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-14 px-4 py-26 sm:px-8">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <p className="eyebrow text-data-dark">Give to get</p>
          <h2 className="m-0 font-display text-4xl leading-[1.1] font-semibold tracking-[-1px] sm:text-[44px]">
            Share your prices, see the full picture.
          </h2>
          <p className="m-0 text-[17px] leading-[1.55] text-body">
            Rivl starts with publicly listed prices. Add your own and you unlock named businesses, price history as it builds and your
            monthly report. Shared prices only ever appear in area averages, never against your name.
          </p>
        </div>
        <div className="grid min-w-0 flex-[1_1_520px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {DATA_POINTS.map(([title, text]) => (
            <div key={title} className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-6">
              <h3 className="m-0 text-lg font-bold">{title}</h3>
              <p className="m-0 text-[15px] leading-normal text-body">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 pt-8 pb-26 sm:px-8">
        <h2 className="m-0 font-display text-[40px] font-semibold tracking-[-1px]">Questions</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-x-12">
          {FAQS.map(([q, a]) => (
            <details key={q} className="border-t border-line-faq py-5.5">
              <summary className="cursor-pointer text-lg font-semibold">{q}</summary>
              <p className="mt-3 mb-0 text-base leading-[1.55] text-body">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mx-auto max-w-[1240px] scroll-mt-6 px-4 pb-14 sm:px-8">
        <div className="flex flex-wrap items-start gap-10 rounded-[32px] border border-line bg-surface px-6 py-12 sm:px-12">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <p className="eyebrow text-data-dark">Register interest</p>
            <h2 className="m-0 font-display text-4xl leading-[1.1] font-semibold tracking-[-1px]">Get Rivl for your area first.</h2>
            <p className="m-0 text-[17px] leading-[1.55] text-body">
              We’re starting with Maidenhead. Register your interest and we’ll tell you as soon as real prices are live near you.
            </p>
          </div>
          <div className="min-w-0 flex-[2_1_440px]">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-[32px] bg-accent px-6 py-16 sm:px-12">
          <h2 className={`${h2} max-w-[640px] leading-[1.05] text-ink`}>See where you stand in two minutes.</h2>
          <Link href="/signup" className="rounded-full bg-ink px-7.5 py-4.5 text-[17px] font-bold text-paper hover:bg-ink-3">
            Get started free
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
