-- ============================================================================
-- CodeKwes · Supabase schema
--
-- HOW TO USE
--   1. Create a free project at https://supabase.com/dashboard
--   2. Open  SQL Editor → New query
--   3. Paste this whole file and click "Run"
--
-- The script is safe to re-run: it only creates missing objects and replaces
-- policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- progress — one row per completed practice block per user
-- cert_slug  e.g. 'javascript-v9'
-- block_slug e.g. 'workshop-calculator'
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  cert_slug text not null,
  block_slug text not null,
  completed_at timestamptz not null default now(),
  constraint progress_user_block_unique unique (user_id, cert_slug, block_slug)
);

create index if not exists progress_user_id_idx on public.progress (user_id);

alter table public.progress enable row level security;

drop policy if exists "Users can read own progress" on public.progress;
create policy "Users can read own progress"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.progress;
create policy "Users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own progress" on public.progress;
create policy "Users can delete own progress"
  on public.progress for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- snippets — code saved from the playground
-- ---------------------------------------------------------------------------
create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled snippet',
  html text not null default '',
  css text not null default '',
  js text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists snippets_user_id_idx on public.snippets (user_id);

alter table public.snippets enable row level security;

drop policy if exists "Users can read own snippets" on public.snippets;
create policy "Users can read own snippets"
  on public.snippets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own snippets" on public.snippets;
create policy "Users can insert own snippets"
  on public.snippets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own snippets" on public.snippets;
create policy "Users can update own snippets"
  on public.snippets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own snippets" on public.snippets;
create policy "Users can delete own snippets"
  on public.snippets for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Optional development tip
--   Supabase Dashboard → Authentication → Providers → Email
--   Turn OFF "Confirm email" while developing so new accounts can sign in
--   immediately without clicking a link in their inbox.
-- ============================================================================
