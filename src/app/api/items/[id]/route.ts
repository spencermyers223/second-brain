import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('brain_items')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const { data, error } = await supabase
    .from('brain_items')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('brain_activity').insert({
    item_id: data.id,
    action: 'updated',
    details: { title: data.title, fields: Object.keys(body) },
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Get item info before deleting
  const { data: item } = await supabase
    .from('brain_items')
    .select('title')
    .eq('id', params.id)
    .single();

  const { error } = await supabase
    .from('brain_items')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (item) {
    await supabase.from('brain_activity').insert({
      item_id: params.id,
      action: 'deleted',
      details: { title: item.title },
    });
  }

  return NextResponse.json({ ok: true });
}
