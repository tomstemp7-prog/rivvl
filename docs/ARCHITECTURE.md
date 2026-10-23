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
| Map | MapLibre GL JS 6 (`maplibre-gl`) with OpenFreeMap vector tiles (“liberty” style), in `components/market-map.tsx` | Free, no key, commercial use allowed. Drag, zoom, rotate, full screen; price labels declutter; tap a business for a card. MapLibre’s worker files are copied into `public/maplibre/` by `scripts/copy-maplibre-worker.mjs` before every dev start and build. Falls back to a drawn map if the postcode lookup fails. The dev server takes ~10 s to start the map; production takes under a second |
| Business lists | OpenStreetMap snapshot via the Overpass API | `scripts/fetch-osm-businesses.mjs` writes `lib/data/maidenhead-businesses.json` |
| Waitlist | Formspree form `xppqgrdo` | Free plan: 50 submissions a month. Endpoint is in `components/waitlist-form.tsx` |
| Analytics | Vercel Web Analytics (`@vercel/analytics`) | Cookieless; see the Analytics tab in Vercel |
| Database | Supabase Postgres (London), connected through Vercel → Storage | Tables `sites`, `shared_prices`, `interest` (`0001_init.sql`) and `businesses`, `price_checks`, `price_observations` (`0002_businesses.sql`), in `supabase/migrations/`. RLS on with no policies: only the server's secret key can read/write. Keys are Vercel “Sensitive” variables, so they can’t be pulled to a laptop; without them the site runs URL-only and skips saving |
| Updates | Dependabot (`.github/dependabot.yml`) | Weekly npm PRs; security alerts and fixes enabled on the repo |

Running cost today: £0 (all free tiers, no domain yet).

## How the app works

Owners **log in with an email code** (built, switched off until email sending is set up; see “Logins” below). A Supabase database stores what businesses enter (see “Database” below). Three kinds of data:

1. **The owner's profile** travels in the URL query string: `name`, `sector`, `postcode`, `radius`, `shared` (1 = shared prices), and prices as `p_<itemId>`. See `lib/profile.ts` (`parseProfile`, `profileQuery`, `profileOrDemo`). Dashboard pages without a `name` fall back to `DEMO_PROFILE` in `lib/mock-market.ts`: the fictional Iron & Oak Fitness at SL6 7AA (Maidenhead).
2. **Market data** ships inside the code:
   - `lib/markets.ts` → `marketFor(sector, postcode, place)` decides what a profile is compared against. Postcodes in a covered region get **real businesses**: Berkshire, decided by the postcode's council (`REGIONS` in `lib/towns.ts`: Bracknell Forest, Reading, Slough, West Berkshire, Windsor and Maidenhead, Wokingham). Everywhere else gets **anonymous sample data**. Prices are only researched in Maidenhead (`PRICED_TOWNS`); elsewhere in Berkshire the dashboards show real businesses and say prices are coming.
   - Real: the Supabase tables `businesses`, `price_checks` and `price_observations` are the **source of truth**, read by `lib/town-data.ts` (`loadTown`, cached for 5 minutes). When the database isn't configured or can't be read, it falls back to the code files `lib/data/maidenhead-businesses.json` (OSM snapshot) + `lib/data/maidenhead-prices.ts` (researched prices, businesses OSM is missing, sector fixes). Equal distances sort alphabetically, so both sources give identical pages.
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
| `/login`, `/dashboard/prices` (edit my prices) | `app/login/…`, `app/dashboard/prices/…` |
| `/auth/callback`, `/auth/confirm` (email link landings) | `app/auth/…` |
| `/api/nearby` | `app/api/nearby/route.ts` |

All dashboard pages use `components/dashboard-shell.tsx` (sidebar + "demo / early preview" strip). The limited view (`shared=0`) anonymises rivals as "Gym A", "Gym B"… via `rivalName()`.

## Database

- `app/actions.ts`: server functions behind the forms (`submitSignup`, `submitInterest`); every field is validated server-side.
- `lib/sites.ts`: saving sites, shared prices and interest; `resolveProfile` (dashboard pages load `?site=<uuid>`, else URL details, else the demo); `pooledPrices` (owner-shared prices join area medians only when at least `MIN_SHARED_PRICES` = 5 exist for that item within the radius, and only anonymous lists leave the server).
- `lib/db.ts`: server-only Supabase client; returns null when keys are missing so local dev still works.
- Sign-up step 2 saves the business, contact email, prices and extra items, then sends the owner to `/dashboard?site=<id>`. Register interest saves to `interest` (and a consented headline price to `shared_prices`) and still emails via Formspree.
- Browse data in Supabase → Table Editor (open from Vercel → rivl-site → Storage). New schema changes: add `supabase/migrations/000N_*.sql` and run it in Supabase’s SQL Editor.
- A `?site=` dashboard with no owner yet is viewable by anyone with the link; once an owner has claimed it, only they can open it (others are sent to `/login`).
- `messages` (`0003_messages.sql`): contact form (`/contact`), the Feedback button on every dashboard page (useful yes/no + comment, with the page and site), and “Is a price here wrong or out of date?” on real competitors’ pages (business, item, suggested price). All via `submitMessage` in `app/actions.ts`; `handled` is for marking them dealt with in the Table Editor. Draft trial terms are at `/terms`.
- **Real businesses and research are also in the database** (`supabase/migrations/0002_businesses.sql`): `businesses` (838 within 10 miles of Maidenhead, `town='Maidenhead'`, plus 539 more from the rest of Berkshire, `town='Berkshire'`, loaded 23 Oct 2026 by `berkshireSeed()`; sector fixes applied, `comparable=false` for non-gyms OSM files as gyms), `price_checks` (one per business researched: outcome published / price_on_request / not_published / members_only, source URL, method website or booking_page, caveat) and `price_observations` (one row per price). **The site reads these tables** (via `lib/town-data.ts`); the code files are only the fallback and the seed. Rows were first built by `lib/seed-towns.ts` from those files; the import is idempotent (upserts) if you ever need to re-seed. To run it: temporarily add a preview-only route that executes the migration and upserts `maidenheadSeed()` with the `postgres` package over `POSTGRES_URL`, deploy with `vercel deploy`, call it with `vercel curl`, then delete the route and the preview (keys are Sensitive, so this runs on Vercel, not a laptop).

## Logins

Supabase Auth with **6-digit email codes** (no passwords), via `@supabase/ssr`.

- `proxy.ts` (Next 16's name for middleware) refreshes the session cookie on `/dashboard`, `/login`, `/auth` and `/signup`.
- `lib/auth.ts`: `currentUser()` (server only, `getClaims()`); `claimSites()` links any business whose sign-up `contact_email` matches the login email (`sites.owner_id`, migration `0004_site_owners.sql`). New sign-ups made while logged in are linked straight away.
- `app/auth-actions.ts`: `sendLoginCode`, `verifyLoginCode`, `signOut`, `saveMyPrices` (the business is always the logged-in owner's, never taken from the form).
- `/login` asks for the email, then the code. The email also has a one-tap link (`/auth/confirm`). Logged-in owners get "Your prices" → `/dashboard/prices` and a Log out button in the sidebar; `/dashboard` with no details opens their own business.
- `lib/auth-config.ts`: the **switch** `NEXT_PUBLIC_LOGIN_LIVE=1` makes the header's "Log in" go to `/login` (off: it opens the demo). `/login` itself works either way, so it can be tested before switching on.

### Go-live checklist (after rivl.uk and Brevo are set up)

1. **Brevo SMTP** → Supabase → Authentication → Emails → SMTP Settings: host `smtp-relay.brevo.com`, port 587, the Brevo SMTP login and key, sender `hello@rivl.uk`, name "Rivl". (Supabase's built-in email only reaches members of the Supabase organisation and a few emails an hour.) Raise Authentication → Rate Limits → emails per hour to ~100.
2. **Email templates** → same page → Templates: paste `supabase/templates/login.html` into both "Magic link" and "Confirm signup", subject `Your Rivl login code: {{ .Token }}`. Check Authentication → Sign In / Providers → Email: OTP length 6 (the login form expects 6 digits), expiry 3600 seconds.
3. **URLs** → Authentication → URL Configuration: Site URL `https://rivl.uk`; Redirect URLs `https://rivl.uk/**`, `https://rivl-site.vercel.app/**`, `http://localhost:3000/**`.
4. **Test** with your own email at `/login`: code arrives from hello@rivl.uk, logs in, "Your prices" saves.
5. **Switch on**: Vercel → rivl-site → Settings → Environment Variables → add `NEXT_PUBLIC_LOGIN_LIVE` = `1` (Production), then Redeploy.

Testers log in with the same email they signed up with; their business is linked automatically.

## Data rules (keep these)

1. **Never show a made-up price against a real business name.** Real businesses only show prices read from the business's **own** website or **own** booking page (Booksy, Fresha), recorded with the URL and the date checked. Third-party resellers (Hussle, ClassPass, Wellhub) and search summaries don't count.
2. If a business doesn't publish prices, record `note: "Price on request"` / `"Not published online"` / `"Members only"` rather than guessing.
3. No invented history for real businesses: history and reports start from the first check (20 Oct 2026 for Maidenhead).
4. Bracketed text like `[LAUNCH TOWN]`, `[£29]` is undecided copy and must stay visibly bracketed.
5. Shared owner prices must only ever appear inside averages. When a database exists, enforce a minimum group size (e.g. 5) so a price can't be worked out in small markets.

## Common tasks

- **Run locally**: Node is at `~/.local/node/bin` on the owner's Mac. `npm install`, `npm run dev` → http://localhost:3000. Check with `npx tsc --noEmit` and `npm run build`.
- **Deploy**: commit and `git push` to `main`; Vercel builds automatically.
- **Add or update a price** (in Supabase → Table Editor or SQL Editor; the site picks it up within 5 minutes, no deploy):
  1. Insert a `price_checks` row: `id` = `<business id>@<YYYY-MM-DD>` (business id is the OSM id like `node/123` or `extra/<slug>`), `business_id`, `checked_on`, `outcome` (`published`, `price_on_request`, `not_published` or `members_only`), `source_url`, `method` (`website` or `booking_page`), optional `caveat` (what the price covers).
  2. For a published price, insert one `price_observations` row per item: `check_id` (the check's id), `item_id` (from `lib/sectors.ts`, e.g. `monthly`, `haircut`), `price`.
  3. A newer check replaces the older one on the site (the latest `checked_on` wins). For a clearer name, set `display_name` on the business.
  Example: `insert into price_checks (id, business_id, checked_on, outcome, source_url, method) values ('node/123@2026-11-01', 'node/123', '2026-11-01', 'published', 'https://…', 'website'); insert into price_observations (check_id, item_id, price) values ('node/123@2026-11-01', 'monthly', 35);`
  Also add it to `lib/data/maidenhead-prices.ts` if the local fallback should match.
- **Add a business OSM is missing**: insert a `businesses` row (`id` = `extra/<slug>`, `town`, `name`, `sector`, `lat`/`lng` from its postcode via postcodes.io, `source` = `manual`, `listed_on`); mirror it in `MAIDENHEAD_EXTRA` for the fallback.
- **Fix a mis-sectored business**: update its `sector` in `businesses` (and `MAIDENHEAD_SECTOR_FIXES` for the fallback). Hide a non-comparable one with `comparable = false`.
- **Refresh the business snapshot**: `node scripts/fetch-osm-businesses.mjs` (the public Overpass server is often busy; the script retries), then re-run the import so the `businesses` table matches. Price checks reference OSM ids, so check none disappeared.
- **Cover another county**: add it to `REGIONS` in `lib/towns.ts` (its councils, as postcodes.io names them) and `REGION_META` in `lib/town-data.ts` (its rows' town labels, coverage outline, credit), snapshot it (`node scripts/fetch-osm-businesses.mjs <county>` after adding the county to the script; it also saves a simplified outline, used to say “at least N” when a search circle runs past the data's edge), then load the rows like `berkshireSeed()`.
- **Research prices in another town**: add its prices like Maidenhead's and its name to `PRICED_TOWNS`.

## What's researched so far (20 Oct 2026)

- Gyms with prices: PureGym Maidenhead, Braywick, Cox Green, Furze Platt (Leisure Focus), Monkey Muay Thai, PureGym Burnham, The Gym Group Slough, Court Garden (Marlow), Windsor Leisure Centre. Price on request: David Lloyd, Anytime Fitness. Not published: F45, Bodyfit, ICON. Members only: The Loft at Burnham.
- Barbers with prices: Rad's Barbers, BART Barbers, Unit1 Barbers. Ten others within 3 miles publish no prices online.
- **Gyms across Berkshire (23 Oct 2026)**: every gym in the Berkshire and Maidenhead-area lists checked, in `lib/data/berkshire-prices.ts` (same rules; `BERKSHIRE_NOT_COMPARABLE` flags duplicates, personal trainers and venues). 34 of 78 publish at least one price; Better and Everyone Active centres only show monthly prices inside their online joining, so only their day passes are recorded; David Lloyd and Anytime Fitness are price on request. Loaded into the database by `berkshireResearchSeed()`.
- **Barbers, nail bars and beauty salons across Berkshire (24 Oct 2026)**: those with a website on the map data checked (51 barbers, 17 nail bars, 13 beauty salons; 20 publish prices), in the same file. Businesses without a website weren't searched one by one (a sample of about 20 barbers found only 2 with published prices), so they show as “not collected”, not “not published”. `BERKSHIRE_SECTOR_FIXES` moves unisex hair salons OSM files as barbers into Hair salon; clinics, tanning shops and similar are flagged not comparable.
- Other sectors: real businesses shown, prices not collected yet.

## Known limits

Logins switched off until email sending is set up; no real price history yet; prices collected by hand; free-tier ceilings (Vercel Hobby non-commercial, Formspree 50/month, OSM tile fair use); Privacy and Terms pages are drafts with placeholders.

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
