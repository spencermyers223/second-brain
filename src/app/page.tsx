'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, BrainActivity, STATUSES, getPriorityStyle, getProjectStyle } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';
import QuickAdd from '@/components/QuickAdd';

export default function Dashboard() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [activity, setActivity] = useState<BrainActivity[]>([]);

  const load = useCallback(async () => {
    const [itemsRes, actRes] = await Promise.all([
      fetch('/api/items'),
      fetch('/api/activity?limit=15'),
    ]);
    setItems(await itemsRes.json());
    setActivity(await actRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = (s: string) => items.filter((i) => i.status === s);
  const highPriority = items.filter((i) => i.priority === 'high' && i.status !== 'done');
  const reviewNeeded = byStatus('review-needed');

  const actionIcon = (action: string) => {
    if (action === 'created') return '✦';
    if (action === 'moved') return '→';
    if (action === 'updated') return '✎';
    if (action === 'deleted') return '✕';
    return '•';
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <div key={s.value} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{byStatus(s.value).length}</div>
            <div className="text-sm text-zinc-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* High priority */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-4">🔥 High Priority</h2>
          {highPriority.length === 0 ? (
            <p className="text-sm text-zinc-600">No high priority items</p>
          ) : (
            <div className="space-y-2">
              {highPriority.slice(0, 5).map((item) => (
                <Link key={item.id} href={`/items/${item.id}`} className="flex items-center gap-3 py-2 hover:bg-zinc-800/50 rounded-lg px-2 -mx-2 transition-colors">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>{item.project}</span>
                  <span className="text-sm text-white truncate flex-1">{item.title}</span>
                  <span className="text-xs text-zinc-500">{item.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Review needed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-yellow-400 mb-4">👀 Needs Review</h2>
          {reviewNeeded.length === 0 ? (
            <p className="text-sm text-zinc-600">Nothing to review</p>
          ) : (
            <div className="space-y-2">
              {reviewNeeded.slice(0, 5).map((item) => (
                <Link key={item.id} href={`/items/${item.id}`} className="flex items-center gap-3 py-2 hover:bg-zinc-800/50 rounded-lg px-2 -mx-2 transition-colors">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>{item.priority}</span>
                  <span className="text-sm text-white truncate flex-1">{item.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>{item.project}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-zinc-600">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500 w-5 text-center">{actionIcon(a.action)}</span>
                <span className="text-zinc-300 flex-1 truncate">
                  {a.action === 'created' && `Created "${(a.details as Record<string,string>)?.title}"`}
                  {a.action === 'moved' && `Moved "${(a.details as Record<string,string>)?.title}" ${(a.details as Record<string,string>)?.from} → ${(a.details as Record<string,string>)?.to}`}
                  {a.action === 'updated' && `Updated "${(a.details as Record<string,string>)?.title}"`}
                  {a.action === 'deleted' && `Deleted "${(a.details as Record<string,string>)?.title}"`}
                </span>
                <span className="text-xs text-zinc-600 shrink-0">{formatDistanceToNow(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickAdd onAdded={load} />
    </div>
  );
}
