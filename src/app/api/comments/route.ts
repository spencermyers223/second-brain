import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('task_id');

  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { task_id, author, content } = await req.json();

  if (!task_id || !author || !content) {
    return NextResponse.json({ error: 'task_id, author, and content required' }, { status: 400 });
  }

  // Add the comment
  const { data: comment, error: commentError } = await supabase
    .from('task_comments')
    .insert({ task_id, author, content })
    .select()
    .single();

  if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 });

  // If Spencer comments, move task back to in-progress for ClawdBot to address
  // If ClawdBot comments, move task to needs-review for Spencer
  const newStatus = author === 'spencer' ? 'in-progress' : 'needs-review';
  
  await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', task_id);

  return NextResponse.json(comment, { status: 201 });
}
