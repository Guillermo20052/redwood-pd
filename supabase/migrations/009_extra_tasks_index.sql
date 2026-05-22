-- Optional: index for querying extra task completions by prefix.
-- Extra tasks reuse item_completions with keys like extra-lvl-b-1 … extra-lvl-a-10.
create index if not exists item_completions_extra_prefix_idx
  on item_completions (user_id, item_key)
  where item_key like 'extra-lvl-%';
