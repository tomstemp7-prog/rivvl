-- Rivl: messages from visitors and testers (contact form, page feedback, price corrections).
-- Run once; safe to re-run. Same lock-down as the other tables: only the server can read or write.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('contact', 'feedback', 'correction')),
  -- The page it was sent from, e.g. "/dashboard/benchmark".
  page text check (page is null or char_length(page) <= 200),
  -- The signed-up business sending it, when known.
  site_id uuid references public.sites (id) on delete set null,
  -- For corrections: the business the price is about (businesses.id).
  business_id text references public.businesses (id) on delete set null,
  item_id text,
  suggested_price numeric(10, 2) check (suggested_price is null or (suggested_price >= 0 and suggested_price < 100000)),
  -- For feedback: was this page useful?
  useful boolean,
  name text check (name is null or char_length(name) <= 120),
  email text check (email is null or char_length(email) <= 200),
  body text check (body is null or char_length(body) <= 4000),
  -- Has someone at Rivl dealt with it?
  handled boolean not null default false
);
create index if not exists messages_kind_created on public.messages (kind, created_at desc);

alter table public.messages enable row level security;
