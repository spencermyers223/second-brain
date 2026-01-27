'use client';

import { Attachment } from '@/lib/types';

interface Props {
  attachments: Attachment[];
}

export default function AttachmentGallery({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">Attachments</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((att) => (
          <div key={att.url} className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {att.type.startsWith('image/') ? (
              <a href={att.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-full max-h-80 object-contain bg-zinc-950 hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <video
                src={att.url}
                controls
                className="w-full max-h-80 bg-black"
                preload="metadata"
              />
            )}
            <div className="px-3 py-2 flex items-center justify-between">
              <p className="text-xs text-zinc-500 truncate">{att.name}</p>
              <p className="text-xs text-zinc-600 shrink-0 ml-2">
                {att.size < 1024 * 1024
                  ? `${(att.size / 1024).toFixed(0)} KB`
                  : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
