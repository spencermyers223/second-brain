'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, getPriorityStyle, getProjectStyle } from '@/lib/types';
import Link from 'next/link';
import AttachmentGallery from '@/components/AttachmentGallery';

export default function Dashboard() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/items');
    setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter out archived items for main view
  const activeItems = items.filter(i => !i.archived_at);
  const archivedItems = items.filter(i => i.archived_at);
  
  // Core sections - simple and clear
  const needsReview = activeItems.filter(i => i.status === 'review-needed');
  const spencerTasks = activeItems.filter(i => 
    (i.assignee === 'spencer' || i.assignee === 'both') && 
    ['backlog', 'in-progress'].includes(i.status) &&
    i.category !== 'goals' && i.category !== 'ideas'
  ).sort((a, b) => {
    // in-progress first, then by priority
    if (a.status !== b.status) return a.status === 'in-progress' ? -1 : 1;
    const po = { high: 0, medium: 1, low: 2 };
    return po[a.priority] - po[b.priority];
  });
  
  const jarvisWorking = activeItems.filter(i => 
    i.assignee === 'jarvis' && 
    i.status === 'in-progress'
  );
  
  const jarvisQueue = activeItems.filter(i => 
    i.assignee === 'jarvis' && 
    i.status === 'backlog' &&
    i.category !== 'goals' && i.category !== 'ideas'
  ).sort((a, b) => {
    const po = { high: 0, medium: 1, low: 2 };
    return po[a.priority] - po[b.priority];
  });
  
  const ideas = activeItems.filter(i => 
    (i.category === 'ideas' || i.category === 'future-projects') && 
    !['done', 'rejected'].includes(i.status)
  );
  
  const goals = activeItems.filter(i => 
    i.category === 'goals' && 
    !['done', 'rejected'].includes(i.status)
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
        body: JSON.stringify({ status: 'done', archived_at: new Date().toISOString() }),
      });
      onUpdate();
    };

    const handleReject = async () => {
      setUpdating(true);
      await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', archived_at: new Date().toISOString() }),
      });
      onUpdate();
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
    };

    return (
      <div className="border border-zinc-800 rounded-lg p-3 space-y-2 hover:border-amber-500/30 transition-colors">
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
          <div className="flex gap-1.5 shrink-0">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
              {item.project}
            </span>
          </div>
        </div>
        {expanded && (
          <div className="space-y-3 pl-5">
            {item.description && (
              <p className="text-xs text-zinc-400">{item.description}</p>
            )}
            {item.notes && (
              <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {item.notes}
              </div>
            )}
            {item.attachments && item.attachments.length > 0 && (
              <AttachmentGallery attachments={item.attachments} />
            )}
            {!item.notes && (!item.attachments || item.attachments.length === 0) && (
              <p className="text-xs text-zinc-600 italic">No content attached.</p>
            )}
            {showFeedback && (
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="What needs to change?"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
                rows={3}
                autoFocus
              />
            )}
            <div className="flex gap-2 pt-1 flex-wrap">
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
                {showFeedback ? '↩ Send' : '↩ Changes'}
              </button>
              <button
                onClick={handleReject}
                disabled={updating}
                className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                ✗ Reject
              </button>
              {showFeedback && (
                <button
                  onClick={() => { setShowFeedback(false); setFeedback(''); }}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskRow = ({ item }: { item: BrainItem }) => (
    <Link
      href={`/items/${item.id}`}
      className="flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
    >
      {item.status === 'in-progress' && (
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
      )}
      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>
        {item.priority === 'high' ? '!!!' : item.priority === 'medium' ? '!!' : '!'}
      </span>
      <span className="text-sm text-zinc-300 truncate flex-1 group-hover:text-white">{item.title}</span>
      <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
        {item.project}
      </span>
    </Link>
  );

  const Section = ({ 
    emoji, 
    title, 
    count, 
    color = 'text-zinc-400',
    border = 'border-zinc-800',
    children,
    empty = 'Nothing here'
  }: { 
    emoji: string; 
    title: string; 
    count: number; 
    color?: string;
    border?: string;
    children: React.ReactNode;
    empty?: string;
  }) => (
    <div className={`bg-zinc-900 border ${border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-sm font-semibold ${color}`}>{emoji} {title}</h2>
        <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-zinc-700 italic py-2">{empty}</p>
      ) : children}
    </div>
  );

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Second Brain</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {activeItems.length} active
            {archivedItems.length > 0 && (
              <button 
                onClick={() => setShowArchive(!showArchive)}
                className="ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                · {archivedItems.length} archived {showArchive ? '▼' : '▶'}
              </button>
            )}
          </p>
        </div>
        <Link href="/items/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
          + Add
        </Link>
      </div>

      {/* NEEDS YOUR REVIEW - Most prominent */}
      <Section 
        emoji="👀" 
        title="Needs Your Review" 
        count={needsReview.length}
        color="text-amber-400"
        border="border-amber-500/30"
        empty="All clear — nothing to review"
      >
        <div className="space-y-2">
          {needsReview.map(item => (
            <ReviewCard key={item.id} item={item} onUpdate={load} />
          ))}
        </div>
      </Section>

      {/* Two column: Your Tasks + Jarvis Status */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Spencer's Tasks */}
        <Section 
          emoji="📋" 
          title="Your Tasks" 
          count={spencerTasks.length}
          color="text-white"
          empty="Nothing on your plate!"
        >
          <div className="space-y-0.5">
            {spencerTasks.map(item => <TaskRow key={item.id} item={item} />)}
          </div>
        </Section>

        {/* Jarvis Working + Queue */}
        <div className="space-y-4">
          <Section 
            emoji="🤖" 
            title="Jarvis Working On" 
            count={jarvisWorking.length}
            color="text-blue-400"
            empty="Picking up next task..."
          >
            <div className="space-y-0.5">
              {jarvisWorking.map(item => <TaskRow key={item.id} item={item} />)}
            </div>
          </Section>

          {jarvisQueue.length > 0 && (
            <Section 
              emoji="📥" 
              title="Jarvis Queue" 
              count={jarvisQueue.length}
              color="text-zinc-500"
              empty=""
            >
              <div className="space-y-0.5">
                {jarvisQueue.slice(0, 5).map(item => <TaskRow key={item.id} item={item} />)}
                {jarvisQueue.length > 5 && (
                  <Link href="/items?assignee=jarvis&status=backlog" className="block text-xs text-zinc-600 hover:text-zinc-400 pt-2">
                    +{jarvisQueue.length - 5} more →
                  </Link>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Ideas + Goals row */}
      {(ideas.length > 0 || goals.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.length > 0 && (
            <Section 
              emoji="💡" 
              title="Ideas & Future" 
              count={ideas.length}
              color="text-yellow-400"
              empty=""
            >
              <div className="space-y-0.5">
                {ideas.slice(0, 5).map(item => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center gap-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <span className="text-zinc-600">•</span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                ))}
                {ideas.length > 5 && (
                  <span className="block text-xs text-zinc-600 pt-1">+{ideas.length - 5} more</span>
                )}
              </div>
            </Section>
          )}
          
          {goals.length > 0 && (
            <Section 
              emoji="🎯" 
              title="Goals" 
              count={goals.length}
              color="text-emerald-400"
              empty=""
            >
              <div className="space-y-0.5">
                {goals.map(item => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center gap-2 py-1.5 group"
                  >
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
                      {item.project}
                    </span>
                    <span className="text-sm text-zinc-300 group-hover:text-white truncate">{item.title}</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Archive (collapsible) */}
      {showArchive && archivedItems.length > 0 && (
        <Section 
          emoji="📦" 
          title="Archive" 
          count={archivedItems.length}
          color="text-zinc-600"
          empty=""
        >
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {archivedItems
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .slice(0, 20)
              .map(item => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex items-center gap-2 py-1.5 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <span>{item.status === 'done' ? '✓' : '✗'}</span>
                  <span className="truncate line-through">{item.title}</span>
                </Link>
              ))}
            {archivedItems.length > 20 && (
              <span className="block text-xs text-zinc-700 pt-1">+{archivedItems.length - 20} more in archive</span>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
