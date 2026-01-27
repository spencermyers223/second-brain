'use client';

import Link from 'next/link';
import { BrainItem, getPriorityStyle, getProjectStyle } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/utils';

export default function ItemCard({ item }: { item: BrainItem }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-white leading-tight line-clamp-2">{item.title}</h3>
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>
          {item.priority}
        </span>
      </div>
      {item.description && (
        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{item.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
          {item.project}
        </span>
        <span className="text-[10px] text-zinc-600">{item.category}</span>
        <span className="text-[10px] text-zinc-700 ml-auto">{formatDistanceToNow(item.created_at)}</span>
      </div>
      {item.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
