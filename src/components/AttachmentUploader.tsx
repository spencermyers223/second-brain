'use client';

import { useCallback, useRef, useState } from 'react';
import { Attachment } from '@/lib/types';

interface Props {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

export default function AttachmentUploader({ attachments, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (res.ok) {
          newAttachments.push(await res.json());
        } else {
          const err = await res.json();
          alert(err.error || 'Upload failed');
        }
      } catch {
        alert('Upload failed');
      }
    }

    if (newAttachments.length > 0) {
      onChange([...attachments, ...newAttachments]);
    }
    setUploading(false);
  }, [attachments, onChange]);

  const remove = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-zinc-400 mb-1.5">Attachments</label>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
        {uploading ? (
          <p className="text-sm text-zinc-400">Uploading...</p>
        ) : (
          <div>
            <p className="text-sm text-zinc-400">Drop files here or click to browse</p>
            <p className="text-xs text-zinc-600 mt-1">Images up to 10MB · Videos up to 50MB</p>
          </div>
        )}
      </div>

      {/* Preview grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((att, i) => (
            <div key={att.url} className="relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
              {att.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.url} alt={att.name} className="w-full h-32 object-cover" />
              ) : (
                <video src={att.url} className="w-full h-32 object-cover" muted />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ✕
              </button>
              <div className="px-2 py-1.5">
                <p className="text-xs text-zinc-400 truncate">{att.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
