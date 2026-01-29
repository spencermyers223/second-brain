import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const account = searchParams.get('account');
  const project = searchParams.get('project');

  let query = supabase
    .from('tweet_drafts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (account) query = query.eq('target_account', account);
  if (project) query = query.eq('project_id', project);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { 
    content, 
    target_account = 'xthreadapp', 
    media_urls = [], 
    project_id = 'xthread',
    created_by = 'clawdbot',
    scheduled_for 
  } = body;

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tweet_drafts')
    .insert({
      content,
      target_account,
      media_urls,
      project_id,
      created_by,
      scheduled_for,
      status: 'pending-review', // Auto-submit for review
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
