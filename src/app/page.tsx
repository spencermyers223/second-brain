'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, getProjectStyle, Project, PROJECTS } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | 'all'>('all');
  const [showOtherSections, setShowOtherSections] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/items');
    setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter by project
  const projectItems = selectedProject === 'all' 
    ? items 
    : items.filter(i => i.project === selectedProject);

  // Filter out archived items for main view
  const activeItems = projectItems.filter(i => !i.archived_at);
  const archivedItems = projectItems.filter(i => i.archived_at);
  
  // ═══════════════════════════════════════════════════════════════
  // SPENCER'S REVIEW QUEUE (The Main Event)
  // Items that need Spencer's eyes, in priority order
  // ═══════════════════════════════════════════════════════════════
  
  // 1. Items explicitly waiting for review
  const reviewNeeded = activeItems
    .filter(i => i.status === 'review-needed')
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return po[a.priority] - po[b.priority];
    });
  
  // 2. Items with feedback (has "--- FEEDBACK ---" that may need action)
  const hasFeedback = activeItems
    .filter(i => 
      i.notes?.includes('--- FEEDBACK ---') && 
      i.status !== 'done' && 
      i.status !== 'rejected'
    );
  
  // 3. Blocking tasks (assigned to Spencer that block Jarvis)
  const blockingTasks = activeItems
    .filter(i => 
      i.assignee === 'spencer' && 
      ['backlog', 'in-progress'].includes(i.status) &&
      (i.title.toLowerCase().includes('block') || 
       i.description?.toLowerCase().includes('block') ||
       i.notes?.toLowerCase().includes('block'))
    );

  // Combine into unified review queue
  const reviewQueue = [
    ...reviewNeeded.map(i => ({ ...i, _queueType: 'review' as const })),
    ...blockingTasks.filter(i => !reviewNeeded.find(r => r.id === i.id))
      .map(i => ({ ...i, _queueType: 'blocking' as const })),
  ].sort((a, b) => {
    // Blocking items first, then by priority
    if (a._queueType !== b._queueType) {
      return a._queueType === 'blocking' ? -1 : 1;
    }
    const po = { high: 0, medium: 1, low: 2 };
    return po[a.priority] - po[b.priority];
  });

  // ═══════════════════════════════════════════════════════════════
  // RECENTLY SHIPPED (last 7 days)
  // ═══════════════════════════════════════════════════════════════
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyShipped = activeItems
    .filter(i => 
      i.category === 'shipped' || 
      (i.status === 'done' && new Date(i.updated_at) > sevenDaysAgo)
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  // ═══════════════════════════════════════════════════════════════
  // SPENCER'S TO-DO (tasks assigned to Spencer, not blocking)
  // ═══════════════════════════════════════════════════════════════
  const spencerTodo = activeItems
    .filter(i => 
      i.assignee === 'spencer' && 
      ['backlog', 'in-progress'].includes(i.status) &&
      i.category !== 'goals' && 
      i.category !== 'ideas' &&
      !blockingTasks.find(b => b.id === i.id)
    )
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in-progress' ? -1 : 1;
      const po = { high: 0, medium: 1, low: 2 };
      return po[a.priority] - po[b.priority];
    });

  // ═══════════════════════════════════════════════════════════════
  // JARVIS STATUS
  // ═══════════════════════════════════════════════════════════════
  const jarvisWorking = activeItems.filter(i => 
    i.assignee === 'jarvis' && i.status === 'in-progress'
  );
  
  const jarvisQueue = activeItems
    .filter(i => 
      i.assignee === 'jarvis' && 
      i.status === 'backlog' &&
      i.category !== 'goals' && i.category !== 'ideas'
    )
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return po[a.priority] - po[b.priority];
    });

  // ═══════════════════════════════════════════════════════════════
  // IDEAS & GOALS
  // ═══════════════════════════════════════════════════════════════
  const ideas = activeItems.filter(i => 
    (i.category === 'ideas' || i.category === 'future-projects') && 
    !['done', 'rejected'].includes(i.status)
  );
  
  const goals = activeItems.filter(i => 
    i.category === 'goals' && !['done', 'rejected'].includes(i.status)
  );

  // ═══════════════════════════════════════════════════════════════
  // COMPONENTS
  // ═══════════════════════════════════════════════════════════════

  const QueueCard = ({ item, queueType, index, onUpdate }: { 
    item: BrainItem; 
    queueType: 'review' | 'blocking';
    index: number;
    onUpdate: () => void;
  }) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [expanded, setExpanded] = useState(false);
    
    const handleApprove = async () => {
      setIsApproving(true);
      await fetch(`/api/items/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
      });
      onUpdate();
      setIsApproving(false);
    };

    const handleReject = async () => {
      setIsRejecting(true);
      await fetch(`/api/items/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      onUpdate();
      setIsRejecting(false);
    };
    
    return (
      <div className={`rounded-xl p-5 ${
        queueType === 'blocking' 
          ? 'bg-red-500/10 border-2 border-red-500/30' 
          : 'bg-yellow-500/10 border-2 border-yellow-500/30'
      }`}>
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Priority number */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
            queueType === 'blocking' 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {index + 1}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Type badge + title */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {queueType === 'blocking' && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-300 font-medium">
                  🚫 BLOCKING
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectStyle(item.project)}`}>
                {item.project}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {item.priority}
              </span>
            </div>
            
            <Link href={`/items/${item.id}`} className="text-lg font-semibold hover:text-white transition-colors block">
              {item.title}
            </Link>
            
            {item.description && (
              <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {queueType === 'review' && (
              <>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-300 text-sm rounded-lg transition-colors"
                >
                  {isRejecting ? '...' : '✕ Reject'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isApproving ? '...' : '✓ Approve'}
                </button>
              </>
            )}
            {queueType === 'blocking' && (
              <Link 
                href={`/items/${item.id}`}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Handle →
              </Link>
            )}
          </div>
        </div>
        
        {/* Notes preview */}
        {item.notes && (
          <div className="mt-3">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {expanded ? '▼ Hide details' : '▶ Show details'}
            </button>
            {expanded && (
              <div className="mt-2 text-sm text-zinc-300 bg-zinc-900/50 rounded-lg p-3 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {item.notes}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ShippedCard = ({ item }: { item: BrainItem }) => {
    const date = new Date(item.updated_at).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    });
    
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
        <span className="text-green-400">✓</span>
        <span className="flex-1 truncate">{item.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectStyle(item.project)}`}>
          {item.project}
        </span>
        <span className="text-xs text-zinc-500">{date}</span>
      </div>
    );
  };

  const TaskCard = ({ item }: { item: BrainItem }) => (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
        <div className={`w-2 h-2 rounded-full ${
          item.status === 'in-progress' ? 'bg-blue-400 animate-pulse' : 
          item.priority === 'high' ? 'bg-red-400' : 
          item.priority === 'medium' ? 'bg-yellow-400' : 'bg-zinc-500'
        }`} />
        <span className="flex-1 truncate group-hover:text-white transition-colors">{item.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectStyle(item.project)}`}>
          {item.project}
        </span>
        {item.status === 'in-progress' && (
          <span className="text-xs text-blue-400">working</span>
        )}
      </div>
    </Link>
  );

  const IdeaCard = ({ item }: { item: BrainItem }) => (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="truncate group-hover:text-white transition-colors">{item.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectStyle(item.project)}`}>
            {item.project}
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Second Brain</h1>
          <div className="flex items-center gap-3">
            <Link href="/items/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
              + Add Item
            </Link>
            <Link href="/board" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
              Board
            </Link>
          </div>
        </div>

        {/* Project Filter */}
        <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-4 overflow-x-auto">
          <button
            onClick={() => setSelectedProject('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedProject === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            All
          </button>
          {PROJECTS.filter(p => p.value !== 'general' && p.value !== 'nomad-research').map(project => (
            <button
              key={project.value}
              onClick={() => setSelectedProject(project.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedProject === project.value 
                  ? `${project.color.replace('text-', 'bg-').replace('/10', '/20')} ${project.color.split(' ')[0]}` 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {project.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* REVIEW QUEUE - THE MAIN EVENT */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {reviewQueue.length > 0 ? (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold">📋 Your Review Queue</h2>
              <span className="text-sm text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
                {reviewQueue.length} item{reviewQueue.length !== 1 ? 's' : ''} need{reviewQueue.length === 1 ? 's' : ''} attention
              </span>
            </div>
            <p className="text-zinc-500 text-sm mb-4">
              Work through these in order. Approve, reject, or handle each one.
            </p>
            <div className="space-y-4">
              {reviewQueue.map((item, index) => (
                <QueueCard 
                  key={item.id} 
                  item={item} 
                  queueType={item._queueType}
                  index={index}
                  onUpdate={load} 
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-10">
            <div className="text-center py-12 bg-green-500/5 border border-green-500/20 rounded-xl">
              <div className="text-4xl mb-3">✓</div>
              <h2 className="text-xl font-bold text-green-400 mb-2">Review Queue Clear!</h2>
              <p className="text-zinc-500">Nothing needs your attention right now.</p>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RECENTLY SHIPPED */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {recentlyShipped.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-green-400">🚀</span> Recently Shipped
              <span className="text-sm font-normal text-zinc-500">
                (last 7 days)
              </span>
            </h2>
            <div className="space-y-2">
              {recentlyShipped.slice(0, 5).map(item => (
                <ShippedCard key={item.id} item={item} />
              ))}
              {recentlyShipped.length > 5 && (
                <button
                  onClick={() => setShowOtherSections(true)}
                  className="text-sm text-zinc-500 hover:text-zinc-300 pl-3"
                >
                  +{recentlyShipped.length - 5} more
                </button>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECONDARY SECTIONS (collapsible) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        <div className="border-t border-zinc-800 pt-6 mt-6">
          <button
            onClick={() => setShowOtherSections(!showOtherSections)}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-4"
          >
            {showOtherSections ? '▼' : '▶'} Other Sections 
            <span className="text-zinc-600 ml-2">
              (Spencer: {spencerTodo.length} | Jarvis: {jarvisWorking.length + jarvisQueue.length} | Ideas: {ideas.length})
            </span>
          </button>
          
          {showOtherSections && (
            <div className="space-y-8 mt-4">
              {/* Spencer's To-Do */}
              {spencerTodo.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>👤</span> Spencer&apos;s Tasks
                  </h2>
                  <div className="space-y-1">
                    {spencerTodo.map(item => (
                      <TaskCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Jarvis Status */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-blue-400">🤖</span> Jarvis Status
                </h2>
                {jarvisWorking.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Working On</h3>
                    <div className="space-y-1 mb-4">
                      {jarvisWorking.map(item => (
                        <TaskCard key={item.id} item={item} />
                      ))}
                    </div>
                  </>
                )}
                {jarvisQueue.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-zinc-500 mb-2">Queue ({jarvisQueue.length})</h3>
                    <div className="space-y-1">
                      {jarvisQueue.slice(0, 5).map(item => (
                        <TaskCard key={item.id} item={item} />
                      ))}
                      {jarvisQueue.length > 5 && (
                        <p className="text-xs text-zinc-600 pl-3">+{jarvisQueue.length - 5} more</p>
                      )}
                    </div>
                  </>
                )}
                {jarvisWorking.length === 0 && jarvisQueue.length === 0 && (
                  <p className="text-zinc-500 text-sm">Jarvis is idle — assign some tasks!</p>
                )}
              </section>

              {/* Goals */}
              {goals.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>🎯</span> Goals
                  </h2>
                  <div className="grid md:grid-cols-2 gap-2">
                    {goals.map(item => (
                      <IdeaCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Ideas */}
              {ideas.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>💡</span> Ideas & Future
                  </h2>
                  <div className="grid md:grid-cols-2 gap-2">
                    {ideas.map(item => (
                      <IdeaCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Archive Toggle */}
        <div className="mt-12 border-t border-zinc-800 pt-6">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showArchive ? '▼' : '▶'} Archive ({archivedItems.length} items)
          </button>
          {showArchive && archivedItems.length > 0 && (
            <div className="mt-4 space-y-1 opacity-60">
              {archivedItems.slice(0, 20).map(item => (
                <Link key={item.id} href={`/items/${item.id}`} className="block text-sm text-zinc-500 hover:text-zinc-300 py-1">
                  {item.title}
                </Link>
              ))}
              {archivedItems.length > 20 && (
                <p className="text-xs text-zinc-600">+{archivedItems.length - 20} more archived</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
