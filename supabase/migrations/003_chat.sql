create table if not exists chat_messages (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_idx on chat_messages(created_at desc);

alter table chat_messages enable row level security;

create policy chat_read on chat_messages for select to authenticated using (true);
create policy chat_insert on chat_messages for insert to authenticated with check (user_id = auth.uid());
create policy chat_delete_admin on chat_messages for delete using (public.is_admin());
