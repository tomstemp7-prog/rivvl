-- Rivl: link a signed-up business to the owner's login (Supabase Auth user).
-- Safe to re-run.

alter table public.sites
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

create index if not exists sites_owner on public.sites (owner_id);
-- Logging in with the email used at sign-up claims that business (see lib/auth.ts).
create index if not exists sites_contact_email on public.sites (lower(contact_email));
