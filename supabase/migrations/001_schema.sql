-- Redwood PD schema
create type user_role as enum ('teacher', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  subject text,
  start_date date,
  role user_role not null default 'teacher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table progress_items (
  user_id uuid not null references profiles(id) on delete cascade,
  item_key text not null,
  checked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create table reflections (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  level int not null check (level between 1 and 3),
  session_date date,
  session_title text,
  q1 text,
  q2 text,
  q3 text,
  notes text,
  created_at timestamptz not null default now()
);

create table diploma_events (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  tier int not null check (tier between 1 and 3),
  hours_at_award numeric(5,1) not null,
  awarded_at timestamptz not null default now()
);

create index progress_items_user_idx on progress_items(user_id);
create index reflections_user_idx on reflections(user_id);

alter table profiles enable row level security;
alter table progress_items enable row level security;
alter table reflections enable row level security;
alter table diploma_events enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy profiles_select_own on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id = auth.uid());
create policy profiles_insert_own on profiles for insert with check (id = auth.uid());

create policy progress_own on progress_items for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy reflections_own on reflections for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy diploma_own on diploma_events for select using (user_id = auth.uid() or is_admin());
create policy diploma_insert_own on diploma_events for insert with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
