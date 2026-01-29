import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface SummaryItem {
  time: string;
  text: string;
  category?: 'feature' | 'fix' | 'docs' | 'other';
}

// GET /api/daily-summaries - Get today's summary or a specific date
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const limit = parseInt(searchParams.get('limit') || '7');

  // If specific date requested
  if (dateParam) {
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('date', dateParam)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return empty summary if none exists for date
    if (!data) {
      return NextResponse.json({
        date: dateParam,
        items: [],
        archived: false,
        exists: false,
      });
    }

    return NextResponse.json({ ...data, exists: true });
  }

  // Otherwise return recent summaries
  let query = supabase
    .from('daily_summaries')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (!includeArchived) {
    query = query.eq('archived', false);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/daily-summaries - Add an item to today's summary
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, category, date: dateOverride } = body;

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // Use provided date or today (in CST)
  const now = new Date();
  const cstOffset = -6 * 60; // CST is UTC-6
  const cstDate = new Date(now.getTime() + (cstOffset - now.getTimezoneOffset()) * 60000);
  const today = dateOverride || cstDate.toISOString().split('T')[0];
  
  // Format time as HH:MM CST
  const timeStr = cstDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Chicago'
  });

  const newItem: SummaryItem = {
    time: timeStr,
    text,
    category: category || 'other',
  };

  // Check if today's summary exists
  const { data: existing } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('date', today)
    .single();

  if (existing) {
    // Append to existing items
    const updatedItems = [...(existing.items || []), newItem];
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .update({ items: updatedItems })
      .eq('date', today)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    // Create new summary for today
    const { data, error } = await supabase
      .from('daily_summaries')
      .insert({
        date: today,
        items: [newItem],
        archived: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
}

// PATCH /api/daily-summaries - Archive a day's summary
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { date, archived } = body;

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('daily_summaries')
    .update({ archived: archived ?? true })
    .eq('date', date)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
