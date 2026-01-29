'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Project, Task, ActivityLog, TaskComment, PROJECT_COLORS, PRIORITY_STYLES } from '@/lib/types';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/activity?limit=10').then(r => r.json()),
    ]).then(([p, t, a]) => {
      setProjects(p);
      setTasks(t);
      setActivity(a);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading...</div>;
  }

  const getProjectTasks = (projectId: string) => tasks.filter(t => t.project_id === projectId);
  const getActiveTasks = (projectId: string) => getProjectTasks(projectId).filter(t => t.status !== 'done');

  const needsReview = tasks.filter(t => t.status === 'needs-review');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Project Hub</h1>
        <p className="text-zinc-500 mt-1">Spencer & ClawdBot</p>
      </div>

      {/* Needs Your Review - Priority Section */}
      {needsReview.length > 0 && (
        <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">⚡ Needs Your Review ({needsReview.length})</h2>
          <div className="space-y-3">
            {needsReview.map((task) => (
              <ReviewCard 
                key={task.id} 
                task={task} 
                projects={projects}
                onComment={load}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          label="Spencer's Tasks" 
          value={tasks.filter(t => t.assignee === 'spencer' && t.status !== 'done').length} 
          href="/tasks?assignee=spencer"
        />
        <StatCard 
          label="ClawdBot's Tasks" 
          value={tasks.filter(t => t.assignee === 'clawdbot' && t.status !== 'done').length}
          href="/tasks?assignee=clawdbot"
        />
        <StatCard 
          label="Needs Review" 
          value={tasks.filter(t => t.status === 'needs-review').length}
          href="/tasks?status=needs-review"
          highlight
        />
        <StatCard 
          label="Done This Week" 
          value={tasks.filter(t => t.status === 'done' && isThisWeek(t.completed_at)).length}
        />
      </div>

      {/* Projects */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const projectTasks = getProjectTasks(project.id);
            const activeTasks = getActiveTasks(project.id);
            const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
            const needsReview = projectTasks.filter(t => t.status === 'needs-review').length;
            const colorStyle = PROJECT_COLORS[project.color] || PROJECT_COLORS.blue;

            return (
              <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${colorStyle}`}>
                      {project.status}
                    </span>
                    <h3 className="text-lg font-semibold mt-2">{project.name}</h3>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-sm text-zinc-500 mb-3">{project.description}</p>
                )}

                <div className="flex gap-4 text-sm mb-4">
                  <span className="text-zinc-400">{activeTasks.length} active tasks</span>
                  {inProgress > 0 && <span className="text-blue-400">{inProgress} in progress</span>}
                  {needsReview > 0 && <span className="text-yellow-400">{needsReview} need review</span>}
                </div>

                <div className="flex gap-2 text-xs">
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" 
                       className="px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                      GitHub
                    </a>
                  )}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                      Live Site
                    </a>
                  )}
                  <Link href={`/tasks?project=${project.id}`}
                        className="px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                    View Tasks →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two columns: Spencer's Tasks and ClawdBot's Tasks */}
      <div className="grid md:grid-cols-2 gap-6">
        <TaskList 
          title="Spencer's Tasks" 
          tasks={tasks.filter(t => t.assignee === 'spencer' && t.status !== 'done').slice(0, 5)}
          emptyMessage="No tasks for Spencer"
        />
        <TaskList 
          title="ClawdBot's Tasks" 
          tasks={tasks.filter(t => t.assignee === 'clawdbot' && t.status !== 'done').slice(0, 5)}
          emptyMessage="No tasks for ClawdBot"
        />
      </div>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Link href="/activity" className="text-sm text-zinc-500 hover:text-white">View all →</Link>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          {activity.length > 0 ? activity.map((item) => (
            <div key={item.id} className="p-4 flex items-start gap-3">
              <span className="text-lg">{item.actor === 'spencer' ? '👤' : '🤖'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{item.actor === 'spencer' ? 'Spencer' : 'ClawdBot'}</span>
                  {' '}{item.action}
                  {item.target_title && <span className="text-zinc-400"> — {item.target_title}</span>}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{formatTime(item.created_at)}</p>
              </div>
            </div>
          )) : (
            <p className="p-4 text-zinc-500 text-sm">No activity yet</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: number; href?: string; highlight?: boolean }) {
  const content = (
    <div className={`bg-zinc-900 border rounded-xl p-4 ${highlight && value > 0 ? 'border-yellow-500/50' : 'border-zinc-800'}`}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight && value > 0 ? 'text-yellow-400' : ''}`}>{value}</p>
    </div>
  );
  
  if (href) return <Link href={href} className="hover:opacity-80 transition-opacity">{content}</Link>;
  return content;
}

function TaskList({ title, tasks, emptyMessage }: { title: string; tasks: Task[]; emptyMessage: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {tasks.length > 0 ? tasks.map((task) => (
          <div key={task.id} className="p-3 flex items-center gap-3">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
            <span className="flex-1 truncate text-sm">{task.title}</span>
            <span className="text-xs text-zinc-500">{task.status}</span>
          </div>
        )) : (
          <p className="p-4 text-zinc-500 text-sm">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ 
  task, 
  projects,
  onComment 
}: { 
  task: Task; 
  projects: Project[];
  onComment: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const project = projects.find(p => p.id === task.project_id);
  const colorStyle = project ? PROJECT_COLORS[project.color] || PROJECT_COLORS.blue : '';

  const loadComments = async () => {
    setLoadingComments(true);
    const res = await fetch(`/api/comments?task_id=${task.id}`);
    const data = await res.json();
    setComments(data);
    setLoadingComments(false);
  };

  const handleExpand = () => {
    if (!expanded) {
      loadComments();
    }
    setExpanded(!expanded);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: task.id,
        author: 'spencer',
        content: newComment.trim(),
      }),
    });
    setNewComment('');
    setSending(false);
    onComment(); // Refresh dashboard
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-start gap-3 cursor-pointer" onClick={handleExpand}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
            {project && (
              <span className={`text-xs px-1.5 py-0.5 rounded border ${colorStyle}`}>
                {project.name}
              </span>
            )}
            <span className="text-xs text-zinc-500">
              {task.assignee === 'spencer' ? '👤' : '🤖'} {task.assignee}
            </span>
          </div>
          <h3 className="font-medium">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-zinc-400 mt-1">{task.description}</p>
          )}
        </div>
        <span className="text-zinc-500">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          {/* Comments */}
          <div className="space-y-3 mb-4">
            {loadingComments ? (
              <p className="text-sm text-zinc-500">Loading comments...</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className={`p-3 rounded-lg ${comment.author === 'spencer' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {comment.author === 'spencer' ? '👤 Spencer' : '🤖 ClawdBot'}
                    </span>
                    <span className="text-xs text-zinc-500">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No comments yet</p>
            )}
          </div>

          {/* Add Comment */}
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add feedback or request changes..."
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={sending || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Your comment will send this back to ClawdBot for revision
          </p>
        </div>
      )}
    </div>
  );
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
