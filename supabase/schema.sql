-- Базовая схема контентной админки blumental-ndv.ru
-- Выполнить в Supabase SQL Editor после создания проекта.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('review', 'object', 'case', 'article', 'page')),
  slug text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(type, slug)
);

create table if not exists public.content_relations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.content_items(id) on delete cascade,
  target_id uuid not null references public.content_items(id) on delete cascade,
  relation_type text not null check (relation_type in ('review_object', 'review_case', 'review_page', 'object_case', 'object_page', 'case_page')),
  created_at timestamptz not null default now(),
  unique(source_id, target_id, relation_type),
  check (source_id <> target_id)
);

create index if not exists content_items_type_status_idx on public.content_items(type, status);
create index if not exists content_relations_source_idx on public.content_relations(source_id);
create index if not exists content_relations_target_idx on public.content_relations(target_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_items_updated_at on public.content_items;
create trigger content_items_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

alter table public.profiles enable row level security;
alter table public.content_items enable row level security;
alter table public.content_relations enable row level security;

drop policy if exists "Read own profile or admin" on public.profiles;
create policy "Read own profile or admin" on public.profiles
for select to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public reads published content" on public.content_items;
create policy "Public reads published content" on public.content_items
for select to anon, authenticated
using (status = 'published' or public.can_edit_content());

drop policy if exists "Editors manage content" on public.content_items;
create policy "Editors manage content" on public.content_items
for all to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

drop policy if exists "Public reads relations for published content" on public.content_relations;
create policy "Public reads relations for published content" on public.content_relations
for select to anon, authenticated
using (
  exists (select 1 from public.content_items i where i.id = source_id and i.status = 'published')
  or public.can_edit_content()
);

drop policy if exists "Editors manage relations" on public.content_relations;
create policy "Editors manage relations" on public.content_relations
for all to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

-- После первого входа владельца назначьте ему роль admin:
-- insert into public.profiles(user_id, display_name, role)
-- select id, 'Владелец', 'admin' from auth.users where email = 'ВАШ_EMAIL'
-- on conflict (user_id) do update set role = 'admin';
--
