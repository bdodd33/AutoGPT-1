-- IdeaBrowser initial schema: profiles, ideas, deep-dive sections, scores,
-- signals, saved ideas, agent runs, subscriptions. With Row Level Security.

-- ---------- Enums ----------
create type idea_status as enum ('draft', 'published');
create type user_role as enum ('user', 'admin');
create type plan_tier as enum ('free', 'starter', 'pro');
create type section_type as enum (
  'summary', 'value_ladder', 'why_now', 'proof_signals', 'market_gap',
  'execution_plan', 'value_equation', 'value_matrix', 'acp',
  'community_signals', 'keywords'
);
create type signal_source as enum ('reddit', 'trends', 'youtube', 'other');

-- ---------- profiles (1:1 with auth.users) ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role user_role not null default 'user',
  plan plan_tier not null default 'free',
  -- founder-fit preferences
  skills text[],
  capital text,            -- e.g. 'bootstrap', '<$10k', '$10k-100k', '$100k+'
  time_commitment text,    -- e.g. 'nights-weekends', 'part-time', 'full-time'
  interests text[],
  created_at timestamptz not null default now()
);

-- Create a profile row automatically on signup.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- ideas ----------
create table ideas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  one_liner text not null,
  category text not null default 'General',
  status idea_status not null default 'draft',
  featured_date date,                  -- the day it was Idea of the Day (nullable)
  created_by_ai boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index ideas_status_idx on ideas (status);
create index ideas_featured_date_idx on ideas (featured_date);

-- ---------- idea_sections (deep-dive blocks) ----------
create table idea_sections (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas (id) on delete cascade,
  type section_type not null,
  title text not null,
  content text not null,               -- lightweight markdown
  position int not null default 0,
  unique (idea_id, type)
);
create index idea_sections_idea_idx on idea_sections (idea_id);

-- ---------- idea_scores ----------
create table idea_scores (
  idea_id uuid primary key references ideas (id) on delete cascade,
  opportunity int not null default 0,
  problem_severity int not null default 0,
  feasibility int not null default 0,
  timing int not null default 0,
  revenue_potential int not null default 0,
  overall int not null default 0
);

-- ---------- signals (enrichment data) ----------
create table signals (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas (id) on delete cascade,
  source signal_source not null,
  metric text not null,
  value text not null,
  detail text,
  raw_json jsonb,
  captured_at timestamptz not null default now()
);
create index signals_idea_idx on signals (idea_id);

-- ---------- saved_ideas ----------
create table saved_ideas (
  user_id uuid not null references auth.users (id) on delete cascade,
  idea_id uuid not null references ideas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, idea_id)
);

-- ---------- agent_runs (interactive research agent) ----------
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  prompt text not null,
  status text not null default 'complete',
  result text,
  tokens int,
  created_at timestamptz not null default now()
);
create index agent_runs_user_idx on agent_runs (user_id);

-- ---------- subscriptions (Stripe — Phase 4) ----------
create table subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  price_id text,
  status text,
  current_period_end timestamptz
);

-- ---------- Helper: is the current user an admin? ----------
create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table ideas enable row level security;
alter table idea_sections enable row level security;
alter table idea_scores enable row level security;
alter table signals enable row level security;
alter table saved_ideas enable row level security;
alter table agent_runs enable row level security;
alter table subscriptions enable row level security;

-- profiles: a user sees/edits their own; admins see all.
create policy "profiles self read" on profiles for select using (auth.uid() = id or is_admin());
create policy "profiles self update" on profiles for update using (auth.uid() = id);

-- ideas: published readable by anyone; drafts + writes are admin-only.
create policy "ideas public read" on ideas for select using (status = 'published' or is_admin());
create policy "ideas admin write" on ideas for all using (is_admin()) with check (is_admin());

-- sections/scores/signals follow their parent idea's visibility.
create policy "sections read" on idea_sections for select
  using (exists (select 1 from ideas i where i.id = idea_id and (i.status = 'published' or is_admin())));
create policy "sections admin write" on idea_sections for all using (is_admin()) with check (is_admin());

create policy "scores read" on idea_scores for select
  using (exists (select 1 from ideas i where i.id = idea_id and (i.status = 'published' or is_admin())));
create policy "scores admin write" on idea_scores for all using (is_admin()) with check (is_admin());

create policy "signals read" on signals for select
  using (exists (select 1 from ideas i where i.id = idea_id and (i.status = 'published' or is_admin())));
create policy "signals admin write" on signals for all using (is_admin()) with check (is_admin());

-- saved_ideas / agent_runs / subscriptions: owner-scoped.
create policy "saved owner" on saved_ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agent owner" on agent_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subs owner read" on subscriptions for select using (auth.uid() = user_id or is_admin());
