import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // List all files in the attachments bucket
    const { data: files, error } = await supabase.storage
      .from('attachments')
      .list('', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URLs for all files
    const filesWithUrls = files
      .filter(f => f.name !== '.emptyFolderPlaceholder') // Filter out placeholder files
      .map(file => {
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(file.name);

        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'application/octet-stream',
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          url: urlData.publicUrl,
        };
      });

    return NextResponse.json(filesWithUrls);
  } catch (err) {
    console.error('Error listing files:', err);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('name');

    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from('attachments')
      .remove([fileName]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting file:', err);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
