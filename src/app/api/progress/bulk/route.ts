import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { items } = (await request.json()) as {
    items: { item_key: string; checked: boolean }[];
  };

  if (!items?.length) return NextResponse.json({ ok: true });

  const rows = items.map((i) => ({
    user_id: user.id,
    item_key: i.item_key,
    checked: i.checked,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('progress_items').upsert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length });
}
