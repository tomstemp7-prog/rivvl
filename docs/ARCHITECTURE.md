# Rivl: architecture and handover

Start here if you are picking up this project: a developer, a freelancer, or a new AI assistant session. It records how the site is built, where the data comes from, the rules we follow, and what comes next. Last updated 20 October 2026.

## What Rivl is

Local pricing intelligence for UK small businesses (gyms, salons, barbers, cafés, beauty, nails, yoga, physio). An owner enters their sector, postcode and catchment, and sees what comparable businesses nearby charge, where they sit, and how prices move.

- Live site: https://rivl-site.vercel.app
- Code: https://github.com/tomstemp7-prog/rivvl (branch `main`)
- Original page designs: `design/*.dc.html` (HTML exports; `{{…}}` placeholders and the `x-dc` script are design-tool logic)

## Stack

| Job | Tool | Notes |
|---|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind CSS 4 | Next 16 differs from older versions: read `node_modules/next/dist/docs/` before using a Next API (see `AGENTS.md`) |
| Hosting | Vercel, Hobby plan, project `rivl-site` | Every push to `main` on GitHub deploys in ~30 s. Hobby is non-commercial: move to Pro before charging customers |
| Postcodes | postcodes.io (ONS Postcode Directory) | Free, no key. Lookups cached for 30 days. `bua` (built-up area) gives the town name |
| Map | OpenStreetMap raster tiles, drawn by `components/street-map.tsx` | Free under the OSM tile usage policy (fair use, attribution required). Falls back to a drawn map if the postcode lookup fails |
| Business lists | OpenStreetMap snapshot via the Overpass API | `scripts/fetch-osm-businesses.mjs` writes `lib/data/maidenhead-businesses.json` |
| Waitlist | Formspree form `xppqgrdo` | Free plan: 50 submissions a month. Endpoint is in `components/waitlist-form.tsx` |
| Analytics | Vercel Web Analytics (`@vercel/analytics`) | Cookieless; see the Analytics tab in Vercel |
| Updates | Dependabot (`.github/dependabot.yml`) | Weekly npm PRs; security alerts and fixes enabled on the repo |

Running cost today: £0 (all free tiers, no domain yet).

## How the app works

There is **no database and no login**. Three kinds of data:

1. **The owner's profile** travels in the URL query string: `name`, `sector`, `postcode`, `radius`, `shared` (1 = shared prices), and prices as `p_<itemId>`. See `lib/profile.ts` (`parseProfile`, `profileQuery`, `profileOrDemo`). Dashboard pages without a `name` fall back to `DEMO_PROFILE` in `lib/mock-market.ts`: the fictional Iron & Oak Fitness at SL6 7AA (Maidenhead).
2. **Market data** ships inside the code:
   - `lib/markets.ts` → `marketFor(sector, postcode, place)` decides what a profile is compared against. Postcodes in a launched town (outcode `SL6` = Maidenhead) get **real businesses**; everywhere else gets **anonymous sample data**.
   - Real: `lib/data/maidenhead-businesses.json` (OSM snapshot, 832 businesses within 10 miles) + `lib/data/maidenhead-prices.ts` (researched prices, businesses OSM is missing, sector fixes).
   - Sample: `lib/mock-market.ts` (`RIVALS` with a year of made-up gym price history; `sampleRivals()` scales typical prices for other sectors).
3. **Live lookups**: postcodes.io from the server (`placeFor`) and the browser (sign-up check), map tiles from OSM, and `app/api/nearby` (business count for the sign-up form, so the 150 KB snapshot never ships to browsers).

Sectors, their comparable price items and billing units ("per month", "per appointment", "per cup"…) are defined in `lib/sectors.ts` (`PRICE_ITEMS`, `CHARGING`).

### Pages

| Route | File |
|---|---|
| `/` home, `/pricing` | `app/page.tsx`, `app/pricing/page.tsx` (shared `components/site-header.tsx`, `site-footer.tsx`) |
| `/signup`, `/signup/prices` | `app/signup/…` (postcode validated live against postcodes.io) |
| `/dashboard` market map | `app/dashboard/page.tsx` + `market-view.tsx` |
| `/dashboard/benchmark` | `app/dashboard/benchmark/page.tsx` |
| `/dashboard/competitors`, `/dashboard/competitors/[id]` | `app/dashboard/competitors/…` |
| `/dashboard/reports` | `app/dashboard/reports/…` (real towns show "first report on 1 Nov 2026"; sample towns show sample reports) |
| `/api/nearby` | `app/api/nearby/route.ts` |

All dashboard pages use `components/dashboard-shell.tsx` (sidebar + "demo / early preview" strip). The limited view (`shared=0`) anonymises rivals as "Gym A", "Gym B"… via `rivalName()`.

## Data rules (keep these)

1. **Never show a made-up price against a real business name.** Real businesses only show prices read from the business's **own** website or **own** booking page (Booksy, Fresha), recorded with the URL and the date checked. Third-party resellers (Hussle, ClassPass, Wellhub) and search summaries don't count.
2. If a business doesn't publish prices, record `note: "Price on request"` / `"Not published online"` / `"Members only"` rather than guessing.
3. No invented history for real businesses: history and reports start from the first check (20 Oct 2026 for Maidenhead).
4. Bracketed text like `[LAUNCH TOWN]`, `[£29]` is undecided copy and must stay visibly bracketed.
5. Shared owner prices must only ever appear inside averages. When a database exists, enforce a minimum group size (e.g. 5) so a price can't be worked out in small markets.

## Common tasks

- **Run locally**: Node is at `~/.local/node/bin` on the owner's Mac. `npm install`, `npm run dev` → http://localhost:3000. Check with `npx tsc --noEmit` and `npm run build`.
- **Deploy**: commit and `git push` to `main`; Vercel builds automatically.
- **Add or update a price**: edit `lib/data/maidenhead-prices.ts`. Key = OSM id from the snapshot (`node/…`, `way/…`) or `extra/<slug>`. Set `prices` (item ids from `lib/sectors.ts`), `url`, `checked` (ISO date), optional `caveat` (what the price covers) and `name` (clearer display name).
- **Add a business OSM is missing**: add it to `MAIDENHEAD_EXTRA` with coordinates from its postcode (postcodes.io).
- **Fix a mis-sectored business**: `MAIDENHEAD_SECTOR_FIXES` (e.g. Toni & Guy → Hair salon).
- **Refresh the business snapshot**: `node scripts/fetch-osm-businesses.mjs` (the public Overpass server is often busy; the script retries). Price keys are OSM ids, so check none disappeared.
- **Launch another town**: add a town to `TOWNS` in `lib/markets.ts` with its outcodes, a snapshot (copy the script's `TOWN` settings) and a prices file.

## What's researched so far (20 Oct 2026)

- Gyms with prices: PureGym Maidenhead, Braywick, Cox Green, Furze Platt (Leisure Focus), Monkey Muay Thai, PureGym Burnham, The Gym Group Slough, Court Garden (Marlow), Windsor Leisure Centre. Price on request: David Lloyd, Anytime Fitness. Not published: F45, Bodyfit, ICON. Members only: The Loft at Burnham.
- Barbers with prices: Rad's Barbers, BART Barbers, Unit1 Barbers. Ten others within 3 miles publish no prices online.
- Other sectors in Maidenhead: real businesses shown, prices not collected yet.

## Known limits

No accounts; no database; "share your prices" isn't stored or pooled; no real price history yet; prices collected by hand; free-tier ceilings (Vercel Hobby non-commercial, Formspree 50/month, OSM tile fair use); Privacy and Contact pages are still "coming soon".

## Roadmap

- **Phase 1, a real product in Maidenhead** (before the first paying customer): logins (e.g. Clerk, Auth.js, Supabase Auth), Postgres database (e.g. Neon, Supabase), shared prices saved and pooled, admin screen for prices, email (e.g. Resend, Postmark), Vercel Pro, own domain, privacy policy, terms, ICO fee check.
- **Phase 2, automate the data**: scheduled collectors per source, change detection, a human review queue before anything shows by name, price history, monthly reports built and emailed, paid map tiles.
- **Phase 3, many towns and sectors**: repeatable town launch, location-aware queries (PostGIS), payments (e.g. Stripe), monitoring, backups, booking-system integrations.

Proposed core tables: `businesses`, `price_items`, `price_observations` (every price seen: amount, source URL, date, method), `accounts`, `sites`, `shared_prices`, `reports`, `waitlist`.

## Open decisions

1. Who builds Phase 1 (owner with Claude, a freelancer, or a technical co-founder).
2. Login and database provider.
3. Legal basics before storing owner data.
4. Keep researching prices by hand, or start automating.
5. Domain and email.

A slide-deck version of this document exists as a private Claude artifact ("Rivl: infrastructure and scaling").
