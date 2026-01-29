'use client';

import { useEffect, useState, useCallback } from 'react';
import { ActivityLog, Project, Assignee, PROJECT_COLORS } from '@/lib/types';

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [actorFilter, setActorFilter] = useState<Assignee | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (actorFilter !== 'all') params.set('actor', actorFilter);
    if (projectFilter !== 'all') params.set('project', projectFilter);

    const [activityRes, projectsRes] = await Promise.all([
      fetch(`/api/activity?${params}`),
      fetch('/api/projects'),
    ]);
    setActivity(await activityRes.json());
    setProjects(await projectsRes.json());
    setLoading(false);
  }, [actorFilter, projectFilter]);

  useEffect(() => { load(); }, [load]);

  // Group by date
  const groupedActivity = activity.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-zinc-500">What&apos;s been happening</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
          {(['all', 'spencer', 'clawdbot'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setActorFilter(a)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                actorFilter === a ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {a === 'all' ? 'All' : a === 'spencer' ? '👤 Spencer' : '🤖 ClawdBot'}
            </button>
          ))}
        </div>
        
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Activity Feed */}
      {Object.keys(groupedActivity).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedActivity).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-zinc-500 mb-3">{date}</h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                {items.map((item) => {
                  const project = projects.find(p => p.id === item.project_id);
                  const colorStyle = project ? PROJECT_COLORS[project.color] : '';
                  
                  return (
                    <div key={item.id} className="p-4 flex items-start gap-4">
                      <span className="text-2xl">
                        {item.actor === 'spencer' ? '👤' : '🤖'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {item.actor === 'spencer' ? 'Spencer' : 'ClawdBot'}
                          </span>
                          <span className="text-zinc-400">{item.action}</span>
                          {project && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorStyle}`}>
                              {project.name}
                            </span>
                          )}
                        </div>
                        
                        {item.target_title && (
                          <p className="text-sm text-zinc-300 mt-1">{item.target_title}</p>
                        )}
                        
                        {item.details && (
                          <p className="text-xs text-zinc-500 mt-1">{item.details}</p>
                        )}
                        
                        <p className="text-xs text-zinc-600 mt-2">
                          {formatTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">No activity yet</p>
          <p className="text-sm text-zinc-600 mt-1">Activity will appear here as you work on tasks.</p>
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
