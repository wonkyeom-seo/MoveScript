create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  email text not null unique,
  display_name text,
  photo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  song_id uuid unique,
  editor_view jsonb not null default '{"x": 360, "y": 260, "scale": 1}'::jsonb,
  share_enabled boolean not null default false,
  share_token text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  duration_seconds numeric(10, 3) not null check (duration_seconds > 0),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.projects
  add constraint projects_song_id_fkey foreign key (song_id) references public.songs(id) on delete set null;

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  order_index integer not null check (order_index >= 0),
  start_time_seconds numeric(10, 3) not null check (start_time_seconds >= 0),
  duration_seconds numeric(10, 3) not null check (duration_seconds >= 1),
  source_scene_id uuid references public.scenes(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, order_index)
);

create table if not exists public.character_defs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stable_key text not null,
  default_label text not null,
  default_display_mode text not null check (default_display_mode in ('name', 'number')),
  default_shape text not null check (default_shape in ('circle', 'rectangle', 'square')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, stable_key)
);

create table if not exists public.scene_people (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  character_def_id uuid not null references public.character_defs(id) on delete cascade,
  x numeric(10, 3) not null,
  y numeric(10, 3) not null,
  is_present boolean not null default true,
  label_override text,
  display_mode text not null check (display_mode in ('name', 'number')),
  shape text not null check (shape in ('circle', 'rectangle', 'square')),
  move_duration_seconds numeric(10, 3),
  entry_type text check (entry_type in ('carry', 'appear')),
  exit_type text check (exit_type in ('stay', 'exit')),
  exit_direction text check (exit_direction in ('front', 'back', 'left', 'right', 'custom')),
  custom_exit_angle_degrees numeric(6, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (scene_id, character_def_id)
);

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_projects_share_token on public.projects(share_token);
create index if not exists idx_scenes_project_order on public.scenes(project_id, order_index);
create index if not exists idx_scene_people_scene on public.scene_people(scene_id);
create index if not exists idx_character_defs_project on public.character_defs(project_id, stable_key);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

drop trigger if exists set_scenes_updated_at on public.scenes;
create trigger set_scenes_updated_at
before update on public.scenes
for each row execute procedure public.set_updated_at();

drop trigger if exists set_scene_people_updated_at on public.scene_people;
create trigger set_scene_people_updated_at
before update on public.scene_people
for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.songs enable row level security;
alter table public.scenes enable row level security;
alter table public.character_defs enable row level security;
alter table public.scene_people enable row level security;

create policy "service role full access users"
on public.users for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access projects"
on public.projects for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access songs"
on public.songs for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access scenes"
on public.scenes for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access character defs"
on public.character_defs for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access scene people"
on public.scene_people for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public)
values ('songs', 'songs', false)
on conflict (id) do nothing;

create policy "service role full access storage objects"
on storage.objects for all
using (bucket_id = 'songs' and auth.role() = 'service_role')
with check (bucket_id = 'songs' and auth.role() = 'service_role');
