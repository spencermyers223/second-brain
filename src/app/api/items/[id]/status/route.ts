import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, position } = await req.json();

  // Get old status for activity log
  const { data: old } = await supabase
    .from('brain_items')
    .select('status, title')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('brain_items')
    .update({ status, position, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (old && old.status !== status) {
    await supabase.from('brain_activity').insert({
      item_id: id,
      action: 'moved',
      details: { title: old.title, from: old.status, to: status },
    });
  }

  return NextResponse.json(data);
}
