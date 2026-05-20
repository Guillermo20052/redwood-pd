create table if not exists item_completions (
  user_id uuid not null references profiles(id) on delete cascade,
  item_key text not null,
  status text not null check (status in ('locked', 'available', 'verified')),
  verified_at timestamptz,
  evidence_text text,
  video_watch_pct numeric(5,2),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create index if not exists item_completions_user_idx on item_completions(user_id);

alter table item_completions enable row level security;

create policy item_completions_own on item_completions
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
