# Rivl website concept: design reference

Eight page designs (in `design/`) for Rivl, exported from the Claude design canvas. Use them as the visual reference when building the real site in Claude Code.

## Pages
Marketing site and sign-up:
- Main.dc.html: home page
- Pricing.dc.html: pricing plans
- Signup.dc.html: sign up, step 1 (sector, postcode, radius)
- SharePrices.dc.html: sign up, step 2 (share your prices)

Product (logged in):
- Dashboard.dc.html: local market map and ranked list
- Benchmark.dc.html: where you sit on each price item
- Competitor.dc.html: a rival's prices and history
- Report.dc.html: monthly and quarterly reports

## Notes for building
- Files are HTML with inline styles. `{{...}}` placeholders and the `<script type="text/x-dc">` block at the bottom of each file are design-tool logic; rebuild that behaviour in your own framework rather than copying it.
- Design tokens: ink #12141C, background #F6F3EC, surface #FFFDF8, border #E3DDD0, muted text #5B5F6A, accent orange #FF6A3D, data blue #2E5BFF (dark #1F3FB8, tint #E3E9FF).
- Fonts: Space Grotesk (headings), DM Sans (body), both from Google Fonts.
- All business names and prices are dummy data. Bracketed text like [LAUNCH TOWN] or [£29] still needs deciding.

## Running the site
Next.js 16 (App Router) + Tailwind CSS v4. Needs Node 20 or later.

```bash
npm install
npm run dev
```

Built so far: home (`/`), pricing (`/pricing`), sign-up step 1 (`/signup`), step 2 (`/signup/prices`) and the logged-in pages: market map (`/dashboard`), benchmark (`/dashboard/benchmark`), competitors (`/dashboard/competitors` and `/dashboard/competitors/<id>`) and reports (`/dashboard/reports`). Sign-up answers pass between pages as URL query params; dashboard pages without a profile in the URL show the demo business (`DEMO_PROFILE` in `lib/mock-market.ts`). All market data, including price history and report events, is mock data in `lib/mock-market.ts`. Privacy and Contact still show a "coming soon" page.
