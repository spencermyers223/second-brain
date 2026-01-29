import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assignee = searchParams.get('assignee');
  const project = searchParams.get('project');
  const status = searchParams.get('status');

  let query = supabase
    .from('tasks')
    .select('*')
    .order('position');

  if (assignee) query = query.eq('assignee', assignee);
  if (project) query = query.eq('project_id', project);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, project_id, assignee, priority, autonomy, estimated_minutes, due_date } = body;

  if (!title || !assignee) {
    return NextResponse.json({ error: 'title and assignee required' }, { status: 400 });
  }

  // Get next position
  const { data: existing } = await supabase
    .from('tasks')
    .select('position')
    .eq('status', 'backlog')
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      project_id,
      assignee,
      priority: priority || 'P2',
      autonomy: autonomy || 'do-then-review',
      estimated_minutes,
      due_date,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
