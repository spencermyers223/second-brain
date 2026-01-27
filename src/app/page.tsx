'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, BrainActivity, getPriorityStyle, getProjectStyle } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';
import QuickAdd from '@/components/QuickAdd';
import AttachmentGallery from '@/components/AttachmentGallery';

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
  const activeCategories = ['tasks', 'content-drafts', 'research'];
  const activeTasks = items.filter(i => activeCategories.includes(i.category) && i.status === 'in-progress');
  const todoCategories = ['tasks', 'content-drafts', 'research'];
  const allTodo = items.filter(i => todoCategories.includes(i.category) && i.status === 'backlog')
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return po[a.priority] - po[b.priority];
    });
  const spencerTodo = allTodo.filter(i => i.assignee === 'spencer' || i.assignee === 'both');
  const jarvisTodo = allTodo.filter(i => i.assignee === 'jarvis');
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

  const categoryLabel = (cat: string) => {
    if (cat === 'content-drafts') return { text: 'draft', style: 'text-pink-400 bg-pink-400/10 border-pink-400/20' };
    if (cat === 'research') return { text: 'research', style: 'text-purple-400 bg-purple-400/10 border-purple-400/20' };
    return null;
  };

  const ItemRow = ({ item, showProject = true, showStatus = false, showCategory = false }: { item: BrainItem; showProject?: boolean; showStatus?: boolean; showCategory?: boolean }) => {
    const catLabel = showCategory ? categoryLabel(item.category) : null;
    return (
      <Link
        href={`/items/${item.id}`}
        className="flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
      >
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>
          {item.priority === 'high' ? '!!!' : item.priority === 'medium' ? '!!' : '!'}
        </span>
        <span className="text-sm text-zinc-200 truncate flex-1 group-hover:text-white">{item.title}</span>
        {catLabel && (
          <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border font-medium ${catLabel.style}`}>
            {catLabel.text}
          </span>
        )}
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
  };

  const SectionHeader = ({ emoji, title, count, color = 'text-zinc-400' }: { emoji: string; title: string; count: number; color?: string }) => (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`text-sm font-semibold ${color}`}>{emoji} {title}</h2>
      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <p className="text-sm text-zinc-700 italic py-2">{text}</p>
  );

  const ReviewCard = ({ item, onUpdate }: { item: BrainItem; onUpdate: () => void }) => {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleApprove = async () => {
      setUpdating(true);
      await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      onUpdate();
      setUpdating(false);
    };

    const handleNeedsChanges = async () => {
      if (!showFeedback) {
        setShowFeedback(true);
        return;
      }
      if (!feedback.trim()) return;
      setUpdating(true);
      const existingNotes = item.notes || '';
      const feedbackBlock = `\n\n--- FEEDBACK ---\n${feedback.trim()}`;
      await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in-progress',
          notes: existingNotes + feedbackBlock,
        }),
      });
      setFeedback('');
      setShowFeedback(false);
      onUpdate();
      setUpdating(false);
    };

    return (
      <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-start gap-2 text-left flex-1 min-w-0"
          >
            <span className="text-amber-400 mt-0.5 text-xs shrink-0">{expanded ? '▼' : '▶'}</span>
            <div className="min-w-0">
              <p className="text-sm text-zinc-200 font-medium">{item.title}</p>
              {item.description && !expanded && (
                <p className="text-xs text-zinc-500 truncate mt-0.5">{item.description}</p>
              )}
            </div>
          </button>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
            {item.project}
          </span>
        </div>
        {expanded && (
          <div className="space-y-3 pl-5">
            {item.description && (
              <p className="text-xs text-zinc-400">{item.description}</p>
            )}
            {item.notes && (
              <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {item.notes}
              </div>
            )}
            {item.attachments && item.attachments.length > 0 && (
              <AttachmentGallery attachments={item.attachments} />
            )}
            {!item.notes && (!item.attachments || item.attachments.length === 0) && (
              <p className="text-xs text-zinc-600 italic">No review content attached yet.</p>
            )}
            {showFeedback && (
              <div className="space-y-2">
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="What needs to change?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  rows={3}
                  autoFocus
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleApprove}
                disabled={updating}
                className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                onClick={handleNeedsChanges}
                disabled={updating || (showFeedback && !feedback.trim())}
                className="px-3 py-1.5 text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors disabled:opacity-50"
              >
                {showFeedback ? '↩ Send Feedback' : '↩ Needs Changes'}
              </button>
              {showFeedback && (
                <button
                  onClick={() => { setShowFeedback(false); setFeedback(''); }}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              )}
              <Link
                href={`/items/${item.id}`}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors ml-auto"
              >
                Edit
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

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

      {/* Needs Review — always visible */}
      <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
        <SectionHeader emoji="👀" title="Needs Your Review" count={reviewItems.length} color="text-amber-400" />
        {reviewItems.length === 0 ? (
          <EmptyState text="Nothing to review — Jarvis is working on it" />
        ) : (
          <div className="space-y-3">
            {reviewItems.map(item => (
              <ReviewCard key={item.id} item={item} onUpdate={load} />
            ))}
          </div>
        )}
      </div>

      {/* In Progress */}
      {activeTasks.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="🔨" title="In Progress" count={activeTasks.length} color="text-blue-400" />
          <div className="space-y-0.5">
            {activeTasks.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Main grid: To Do + Goals */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Spencer's Tasks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="🧑" title="Your Tasks" count={spencerTodo.length} color="text-white" />
          {spencerTodo.length === 0 ? (
            <EmptyState text="Nothing on your plate!" />
          ) : (
            <div className="space-y-0.5">
              {spencerTodo.map(item => <ItemRow key={item.id} item={item} showCategory />)}
            </div>
          )}
        </div>

        {/* Jarvis's Tasks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <SectionHeader emoji="🤖" title="Jarvis Tasks" count={jarvisTodo.length} color="text-zinc-400" />
          {jarvisTodo.length === 0 ? (
            <EmptyState text="All caught up!" />
          ) : (
            <div className="space-y-0.5">
              {jarvisTodo.map(item => <ItemRow key={item.id} item={item} showCategory />)}
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
