'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, BrainActivity, getPriorityStyle, getProjectStyle } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';
import QuickAdd from '@/components/QuickAdd';

export default function Dashboard() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [activity, setActivity] = useState<BrainActivity[]>([]);

  const load = useCallback(async () => {
    const [itemsRes, actRes] = await Promise.all([
      fetch('/api/items'),
      fetch('/api/activity?limit=10'),
    ]);
    setItems(await itemsRes.json());
    setActivity(await actRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sections
  const activeTasks = items.filter(i => i.category === 'tasks' && i.status === 'in-progress');
  const todoTasks = items.filter(i => i.category === 'tasks' && i.status === 'backlog')
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return po[a.priority] - po[b.priority];
    });
  const reviewItems = items.filter(i => i.status === 'review-needed');
  const goals = items.filter(i => i.category === 'goals' && i.status !== 'done');
  const contentDrafts = items.filter(i => i.category === 'content-drafts' && i.status !== 'done');
  const research = items.filter(i => i.category === 'research' && i.status !== 'done');
  const recentlyDone = items.filter(i => i.status === 'done')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);
  const ideas = items.filter(i => i.category === 'ideas' && i.status !== 'done');

  const actionIcon = (action: string) => {
    if (action === 'created') return '✦';
    if (action === 'moved') return '→';
    if (action === 'updated') return '✎';
    if (action === 'deleted') return '✕';
    return '•';
  };

  const ItemRow = ({ item, showProject = true, showStatus = false }: { item: BrainItem; showProject?: boolean; showStatus?: boolean }) => (
    <Link
      href={`/items/${item.id}`}
      className="flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
    >
      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>
        {item.priority === 'high' ? '!!!' : item.priority === 'medium' ? '!!' : '!'}
      </span>
      <span className="text-sm text-zinc-200 truncate flex-1 group-hover:text-white">{item.title}</span>
      {showProject && (
        <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
          {item.project}
        </span>
      )}
      {showStatus && (
        <span className="text-[10px] text-zinc-500">{item.status}</span>
      )}
    </Link>
  );

  const SectionHeader = ({ emoji, title, count, color = 'text-zinc-400' }: { emoji: string; title: string; count: number; color?: string }) => (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`text-sm font-semibold ${color}`}>{emoji} {title}</h2>
      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <p className="text-sm text-zinc-700 italic py-2">{text}</p>
  );

  // Stats
  const totalActive = items.filter(i => i.status !== 'done').length;
  const totalDone = items.filter(i => i.status === 'done').length;

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{totalActive} active · {totalDone} completed</p>
        </div>
        <Link href="/items/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
          + Add Item
        </Link>
      </div>

      {/* Top row: In Progress + Needs Review */}
      {(activeTasks.length > 0 || reviewItems.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {activeTasks.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <SectionHeader emoji="🔨" title="In Progress" count={activeTasks.length} color="text-blue-400" />
              <div className="space-y-0.5">
                {activeTasks.map(item => <ItemRow key={item.id} item={item} />)}
              </div>
            </div>
          )}
          {reviewItems.length > 0 && (
            <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
              <SectionHeader emoji="👀" title="Needs Review" count={reviewItems.length} color="text-amber-400" />
              <div className="space-y-0.5">
                {reviewItems.map(item => <ItemRow key={item.id} item={item} showStatus />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main grid: To Do + Goals */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* To Do - takes 2 cols */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="📋" title="To Do" count={todoTasks.length} color="text-white" />
          {todoTasks.length === 0 ? (
            <EmptyState text="All caught up!" />
          ) : (
            <div className="space-y-0.5">
              {todoTasks.map(item => <ItemRow key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="🎯" title="Goals" count={goals.length} color="text-emerald-400" />
          {goals.length === 0 ? (
            <EmptyState text="No goals set" />
          ) : (
            <div className="space-y-0.5">
              {goals.map(item => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex items-start gap-2.5 py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <span className={`shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
                    {item.project}
                  </span>
                  <span className="text-sm text-zinc-200 leading-snug">{item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Second row: Content Drafts + Research + Ideas */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Content Drafts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="✏️" title="Content Drafts" count={contentDrafts.length} color="text-pink-400" />
          {contentDrafts.length === 0 ? (
            <EmptyState text="No drafts" />
          ) : (
            <div className="space-y-0.5">
              {contentDrafts.map(item => <ItemRow key={item.id} item={item} showProject={false} />)}
            </div>
          )}
        </div>

        {/* Research */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="🔬" title="Research" count={research.length} color="text-purple-400" />
          {research.length === 0 ? (
            <EmptyState text="No research items" />
          ) : (
            <div className="space-y-0.5">
              {research.map(item => <ItemRow key={item.id} item={item} showProject={false} />)}
            </div>
          )}
        </div>

        {/* Ideas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="💡" title="Ideas" count={ideas.length} color="text-yellow-400" />
          {ideas.length === 0 ? (
            <EmptyState text="No ideas yet" />
          ) : (
            <div className="space-y-0.5">
              {ideas.map(item => <ItemRow key={item.id} item={item} showProject={false} />)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Recently Done + Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recently Completed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="✅" title="Recently Done" count={recentlyDone.length} color="text-green-400" />
          {recentlyDone.length === 0 ? (
            <EmptyState text="Nothing completed yet" />
          ) : (
            <div className="space-y-0.5">
              {recentlyDone.map(item => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-zinc-600">✓</span>
                  <span className="text-sm text-zinc-500 line-through truncate flex-1">{item.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
                    {item.project}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="📊" title="Recent Activity" count={activity.length} color="text-zinc-400" />
          {activity.length === 0 ? (
            <EmptyState text="No activity yet" />
          ) : (
            <div className="space-y-1">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 text-sm py-1">
                  <span className="text-zinc-600 w-4 text-center text-xs">{actionIcon(a.action)}</span>
                  <span className="text-zinc-400 flex-1 truncate text-xs">
                    {a.action === 'created' && `Created "${(a.details as Record<string,string>)?.title}"`}
                    {a.action === 'moved' && `Moved "${(a.details as Record<string,string>)?.title}" ${(a.details as Record<string,string>)?.from} → ${(a.details as Record<string,string>)?.to}`}
                    {a.action === 'updated' && `Updated "${(a.details as Record<string,string>)?.title}"`}
                    {a.action === 'deleted' && `Deleted "${(a.details as Record<string,string>)?.title}"`}
                  </span>
                  <span className="text-[10px] text-zinc-700 shrink-0">{formatDistanceToNow(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickAdd onAdded={load} />
    </div>
  );
}
