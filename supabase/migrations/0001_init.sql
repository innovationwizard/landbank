-- ============================================================================
-- Forma Capital Inmobiliario — Land Evaluator schema
-- Run this in Supabase Dashboard → SQL Editor as a single script.
-- Idempotent: safe to re-run; uses `if not exists` where possible.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- profiles (extends auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'evaluator' check (role in ('evaluator','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- zone_benchmarks  (replaces confidential data from src/lib/zones.ts)
-- ============================================================================
create table if not exists public.zone_benchmarks (
  id text primary key,
  location_type text not null check (location_type in ('zona_capital','ciudad_secundaria')),
  zona_number int,
  ciudad_key text,
  display_name text not null,
  strategy text not null check (strategy in ('A','B','C')),
  priority text not null check (priority in ('alta','media','baja')),
  benchmark_min numeric not null,
  benchmark_max numeric not null,
  description text not null,
  sort_order int not null default 0
);

-- ============================================================================
-- eliminatory_criteria  (numeric thresholds only; predicate logic lives in code)
-- ============================================================================
create table if not exists public.eliminatory_criteria (
  id int primary key,
  name text not null,
  justification text not null,
  strategy_scope text check (strategy_scope in ('A','B','C')),
  predicate_key text not null unique,
  threshold jsonb not null default '{}'::jsonb,
  sort_order int not null default 0
);

-- ============================================================================
-- rubric_categories  (8 scorecard categories with 1/3/5 descriptors)
-- ============================================================================
create table if not exists public.rubric_categories (
  id int primary key,
  name text not null,
  manual_section text not null,
  scorer_key text not null unique,
  descriptor_1 text not null,
  descriptor_3 text not null,
  descriptor_5 text not null,
  default_weight numeric not null check (default_weight >= 0 and default_weight <= 10),
  sort_order int not null default 0
);

-- ============================================================================
-- user_weights  (per-user overrides of default_weight)
-- ============================================================================
create table if not exists public.user_weights (
  user_id uuid not null references auth.users on delete cascade,
  category_id int not null references public.rubric_categories on delete cascade,
  weight numeric not null check (weight >= 0 and weight <= 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

-- ============================================================================
-- assessments  (saved evaluations — MVP Deal Tracker)
-- ============================================================================
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text,
  input jsonb not null,
  eliminatory jsonb not null,
  scores jsonb not null,
  final_score numeric not null,
  verdict text not null,
  recommendation text not null,
  strategy text not null,
  weights_snapshot jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessments_user_created_idx
  on public.assessments (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists assessments_touch_updated on public.assessments;
create trigger assessments_touch_updated
  before update on public.assessments
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles              enable row level security;
alter table public.zone_benchmarks       enable row level security;
alter table public.eliminatory_criteria  enable row level security;
alter table public.rubric_categories     enable row level security;
alter table public.user_weights          enable row level security;
alter table public.assessments           enable row level security;

-- profiles: user can read and update own
drop policy if exists "profiles self select" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self select" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles self update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- rubric tables: authenticated read-only. anon role gets nothing.
drop policy if exists "zones auth read" on public.zone_benchmarks;
drop policy if exists "eliminatory auth read" on public.eliminatory_criteria;
drop policy if exists "rubric auth read" on public.rubric_categories;
create policy "zones auth read" on public.zone_benchmarks
  for select to authenticated using (true);
create policy "eliminatory auth read" on public.eliminatory_criteria
  for select to authenticated using (true);
create policy "rubric auth read" on public.rubric_categories
  for select to authenticated using (true);

-- user_weights: user CRUD own
drop policy if exists "weights self all" on public.user_weights;
create policy "weights self all" on public.user_weights
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- assessments: user CRUD own
drop policy if exists "assessments self all" on public.assessments;
create policy "assessments self all" on public.assessments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
