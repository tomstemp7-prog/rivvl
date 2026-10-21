-- Rivl: first database tables. Run once in Supabase → SQL Editor.
--
-- Row Level Security is ON with no policies, so the public (anon) key can read
-- or write nothing. Only the Rivl server, using the secret key, can access the
-- data. Logins and owner-level access come later.

-- A business that signed up (today: through the two-step sign-up).
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text not null check (char_length(business_name) between 1 and 120),
  contact_email text check (contact_email is null or char_length(contact_email) <= 200),
  sector text not null,
  postcode text not null,
  outcode text not null,
  radius text not null,
  lat double precision,
  lng double precision,
  shared boolean not null default false,
  -- Items an owner added beyond the standard ones: [{ "label": "...", "price": 12.5 }]
  extra_items jsonb not null default '[]'::jsonb
);

-- Prices owners choose to share. Only ever used inside anonymised averages.
create table if not exists public.shared_prices (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  site_id uuid references public.sites (id) on delete cascade,
  interest_id bigint,
  sector text not null,
  item_id text not null,
  price numeric(10, 2) not null check (price >= 0 and price < 100000),
  outcode text not null,
  lat double precision,
  lng double precision,
  consented_at timestamptz not null default now(),
  source text not null check (source in ('signup', 'interest'))
);
create index if not exists shared_prices_sector_item on public.shared_prices (sector, item_id);

-- Register-interest sign-ups (previously only emailed via Formspree).
create table if not exists public.interest (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  business_name text not null check (char_length(business_name) between 1 and 120),
  contact_name text check (contact_name is null or char_length(contact_name) <= 120),
  email text not null check (char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  sector text not null,
  postcode text,
  town text,
  source text not null default 'home'
);

alter table public.shared_prices
  drop constraint if exists shared_prices_interest_fk,
  add constraint shared_prices_interest_fk foreign key (interest_id) references public.interest (id) on delete cascade;

alter table public.sites enable row level security;
alter table public.shared_prices enable row level security;
alter table public.interest enable row level security;
