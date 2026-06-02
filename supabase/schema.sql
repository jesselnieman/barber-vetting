-- Center City Barbers — Supabase schema
-- Run this once in the Supabase SQL editor (or `supabase db push`) for a new project.
-- Idempotent: safe to re-run.
--
-- Design notes
-- ------------
-- * ONE table, `submissions`, holds everything. A draft is just a row with
--   status = 'draft'. On submit the same row flips to status = 'new'. The form
--   keeps the row's id in localStorage (ccb_draft_id) so an in-progress
--   application can be restored on reload.
-- * `name`, `email`, `phone`, `years` are promoted out of the answers blob
--   because the review portal treats them as first-class structured fields
--   (it lists, sorts, and links on them). Everything else lives in `answers`.
-- * Security is enforced by RLS, since the anon key ships in the client:
--     - anon (candidates) can create/update/read DRAFTS only.
--     - anon can submit a draft (draft -> new) but cannot touch a row afterward.
--     - submitted rows (status <> 'draft') are invisible to anon — they carry
--       PII and are only readable by allow-listed, magic-link reviewers.
--     - authenticated users get full access ONLY if their email is in the
--       `reviewers` allowlist (otherwise a stranger could sign in via magic
--       link and read the inbox).

create table if not exists public.submissions (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null    default now(),
  name       text,
  email      text,
  phone      text,
  years      integer,
  answers    jsonb       not null    default '{}'::jsonb,
  flags      jsonb       not null    default '[]'::jsonb,
  status     text        not null    default 'draft'
);

-- Reviewer allowlist. Add Bruce's email here (and anyone else allowed in).
create table if not exists public.reviewers (
  email text primary key
);

alter table public.submissions enable row level security;
alter table public.reviewers   enable row level security;
-- No policies on `reviewers` => not directly readable by clients. It is only
-- consulted through is_reviewer() below, which is SECURITY DEFINER.

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.reviewers
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- ---- anon (candidate) policies -------------------------------------------
drop policy if exists "anon insert draft" on public.submissions;
create policy "anon insert draft"
  on public.submissions for insert to anon
  with check (status = 'draft');

drop policy if exists "anon update draft" on public.submissions;
create policy "anon update draft"
  on public.submissions for update to anon
  using (status = 'draft')
  with check (status in ('draft', 'new'));

drop policy if exists "anon select draft" on public.submissions;
create policy "anon select draft"
  on public.submissions for select to anon
  using (status = 'draft');

-- ---- reviewer (authenticated + allowlisted) policies ---------------------
drop policy if exists "reviewer read" on public.submissions;
create policy "reviewer read"
  on public.submissions for select to authenticated
  using (public.is_reviewer());

drop policy if exists "reviewer update" on public.submissions;
create policy "reviewer update"
  on public.submissions for update to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer());

drop policy if exists "reviewer delete" on public.submissions;
create policy "reviewer delete"
  on public.submissions for delete to authenticated
  using (public.is_reviewer());
