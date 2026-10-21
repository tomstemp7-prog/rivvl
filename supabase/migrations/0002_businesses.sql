-- Rivl: real businesses and researched prices (first: Maidenhead).
-- Loaded by lib/seed-towns.ts; safe to re-run (create if not exists).

-- Every business we know of in a launched town.
create table if not exists public.businesses (
  -- OpenStreetMap id ("node/123", "way/456") or "extra/<slug>" for ones added by hand.
  id text primary key,
  town text not null,
  name text not null,
  -- Clearer name where the source's is ambiguous, e.g. "PureGym Maidenhead".
  display_name text,
  sector text not null,
  -- False for things OSM files as a gym that aren't comparable (gymnastics clubs, school halls).
  comparable boolean not null default true,
  lat double precision not null,
  lng double precision not null,
  address text,
  website text,
  source text not null check (source in ('openstreetmap', 'manual')),
  -- When the business list was taken from its source.
  listed_on date not null,
  updated_at timestamptz not null default now()
);
create index if not exists businesses_town_sector on public.businesses (town, sector);

-- Each time we checked whether a business publishes prices, and what we found.
create table if not exists public.price_checks (
  -- "<business id>@<date>", so re-running an import updates rather than duplicates.
  id text primary key,
  business_id text not null references public.businesses (id) on delete cascade,
  checked_on date not null,
  outcome text not null check (outcome in ('published', 'price_on_request', 'not_published', 'members_only')),
  source_url text,
  -- Where the price came from: the business's own website or its own booking page.
  method text check (method in ('website', 'booking_page')),
  -- What a published price covers, e.g. "Core membership".
  caveat text,
  updated_at timestamptz not null default now()
);
create index if not exists price_checks_business on public.price_checks (business_id, checked_on desc);

-- Individual prices seen in a check, one per comparable item (see lib/sectors.ts).
create table if not exists public.price_observations (
  check_id text not null references public.price_checks (id) on delete cascade,
  item_id text not null,
  price numeric(10, 2) not null check (price >= 0 and price < 100000),
  primary key (check_id, item_id)
);

alter table public.businesses enable row level security;
alter table public.price_checks enable row level security;
alter table public.price_observations enable row level security;
