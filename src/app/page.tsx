'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, getProjectStyle, Project, PROJECTS } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | 'all'>('all');

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
  
  // NEEDS TESTING: Recently completed by Jarvis (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const needsTesting = activeItems.filter(i => 
    i.assignee === 'jarvis' && 
    i.status === 'done' &&
    new Date(i.updated_at) > sevenDaysAgo
  ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  
  // Review needed
  const needsReview = activeItems.filter(i => i.status === 'review-needed');
  
  // Spencer's tasks
  const spencerTasks = activeItems.filter(i => 
    (i.assignee === 'spencer' || i.assignee === 'both') && 
    ['backlog', 'in-progress'].includes(i.status) &&
    i.category !== 'goals' && i.category !== 'ideas'
  ).sort((a, b) => {
    if (a.status !== b.status) return a.status === 'in-progress' ? -1 : 1;
    const po = { high: 0, medium: 1, low: 2 };
    return po[a.priority] - po[b.priority];
  });
  
  // Jarvis working now
  const jarvisWorking = activeItems.filter(i => 
    i.assignee === 'jarvis' && 
    i.status === 'in-progress'
  );
  
  // Jarvis queue
  const jarvisQueue = activeItems.filter(i => 
    i.assignee === 'jarvis' && 
    i.status === 'backlog' &&
    i.category !== 'goals' && i.category !== 'ideas'
  ).sort((a, b) => {
    const po = { high: 0, medium: 1, low: 2 };
    return po[a.priority] - po[b.priority];
  });
  
  // Ideas
  const ideas = activeItems.filter(i => 
    (i.category === 'ideas' || i.category === 'future-projects') && 
    !['done', 'rejected'].includes(i.status)
  );
  
  // Goals
  const goals = activeItems.filter(i => 
    i.category === 'goals' && 
    !['done', 'rejected'].includes(i.status)
  );

  const ReviewCard = ({ item, onUpdate }: { item: BrainItem; onUpdate: () => void }) => {
    const [isApproving, setIsApproving] = useState(false);
    
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
    
    return (
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/items/${item.id}`} className="font-medium hover:text-yellow-400 transition-colors">
                {item.title}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectStyle(item.project)}`}>
                {item.project}
              </span>
            </div>
            {item.description && (
              <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
            )}
            {item.notes && (
              <div className="mt-2 text-sm text-zinc-300 bg-zinc-800/50 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {item.notes.substring(0, 500)}{item.notes.length > 500 ? '...' : ''}
              </div>
            )}
          </div>
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex-shrink-0"
          >
            {isApproving ? '...' : '✓ Approve'}
          </button>
        </div>
      </div>
    );
  };

  const TestingCard = ({ item }: { item: BrainItem }) => {
    const completedDate = new Date(item.updated_at).toLocaleDateString();
    
    return (
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{item.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectStyle(item.project)}`}>
                {item.project}
              </span>
              <span className="text-xs text-zinc-500">
                completed {completedDate}
              </span>
            </div>
            {item.description && (
              <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
            )}
          </div>
          <Link 
            href={`/items/${item.id}`}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors flex-shrink-0"
          >
            Details
          </Link>
        </div>
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
        {item.description && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Second Brain</h1>
          <div className="flex items-center gap-3">
            <Link href="/items/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
              + Add Item
            </Link>
            <Link href="/board" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
              Board View
            </Link>
          </div>
        </div>

        {/* Project Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setSelectedProject('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedProject === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            All Projects
          </button>
          {PROJECTS.filter(p => p.value !== 'general' && p.value !== 'nomad-research').map(project => (
            <button
              key={project.value}
              onClick={() => setSelectedProject(project.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedProject === project.value 
                  ? `${project.color.replace('text-', 'bg-').replace('/10', '/20')} ${project.color.split(' ')[0]}` 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {project.label}
            </button>
          ))}
        </div>

        {/* Needs Testing Section */}
        {needsTesting.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">🧪</span> Needs Testing
              <span className="text-sm font-normal text-zinc-500">
                ({needsTesting.length} items completed by Jarvis)
              </span>
            </h2>
            <div className="space-y-2">
              {needsTesting.map(item => (
                <TestingCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Needs Review */}
        {needsReview.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-yellow-400">⚡</span> Needs Review
              <span className="text-sm font-normal text-zinc-500">({needsReview.length})</span>
            </h2>
            <div className="space-y-3">
              {needsReview.map(item => (
                <ReviewCard key={item.id} item={item} onUpdate={load} />
              ))}
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Jarvis Working On */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">🤖</span> Jarvis Working On
            </h2>
            {jarvisWorking.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nothing in progress</p>
            ) : (
              <div className="space-y-1">
                {jarvisWorking.map(item => (
                  <TaskCard key={item.id} item={item} />
                ))}
              </div>
            )}
            
            {jarvisQueue.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-zinc-500 mt-4 mb-2">Up Next</h3>
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
          </section>

          {/* Spencer's Tasks */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>👤</span> Spencer&apos;s Tasks
            </h2>
            {spencerTasks.length === 0 ? (
              <p className="text-zinc-500 text-sm">All clear!</p>
            ) : (
              <div className="space-y-1">
                {spencerTasks.map(item => (
                  <TaskCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Goals */}
        {goals.length > 0 && (
          <section className="mt-8">
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
          <section className="mt-8">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
