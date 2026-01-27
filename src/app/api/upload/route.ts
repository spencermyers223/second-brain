import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const IMAGE_MAX = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX = 50 * 1024 * 1024; // 50MB

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? VIDEO_MAX : IMAGE_MAX;

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${isVideo ? '50MB' : '10MB'}` },
      { status: 400 }
    );
  }

  const ext = file.name.split('.').pop() || 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);

  return NextResponse.json({
    url: urlData.publicUrl,
    name: file.name,
    type: file.type,
    size: file.size,
  });
}
