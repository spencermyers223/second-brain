import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams;
  let query = supabase.from('brain_items').select('*');

  const status = url.get('status');
  const category = url.get('category');
  const project = url.get('project');
  const priority = url.get('priority');
  const search = url.get('search');

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (project) query = query.eq('project', project);
  if (priority) query = query.eq('priority', priority);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await query.order('position', { ascending: true }).order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Get max position for this status
  const { data: maxPos } = await supabase
    .from('brain_items')
    .select('position')
    .eq('status', body.status || 'backlog')
    .order('position', { ascending: false })
    .limit(1);

  const position = maxPos && maxPos.length > 0 ? maxPos[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('brain_items')
    .insert({ ...body, position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from('brain_activity').insert({
    item_id: data.id,
    action: 'created',
    details: { title: data.title, category: data.category },
  });

  return NextResponse.json(data, { status: 201 });
}
