import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project');
  const type = searchParams.get('type');

  let query = supabase
    .from('checklist_items')
    .select('*')
    .order('completed')
    .order('position');

  if (project) query = query.eq('project_id', project);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, project_id, type, due_date } = body;

  if (!title || !type) {
    return NextResponse.json({ error: 'title and type required' }, { status: 400 });
  }

  // Get next position
  const { data: existing } = await supabase
    .from('checklist_items')
    .select('position')
    .eq('type', type)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      title,
      project_id,
      type,
      due_date,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
