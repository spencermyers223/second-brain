'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Task, Project, Assignee, TaskStatus, Priority, STATUS_COLUMNS, PRIORITY_STYLES, PROJECT_COLORS, AUTONOMY_LABELS } from '@/lib/types';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState<Assignee | 'all'>(
    (searchParams.get('assignee') as Assignee) || 'all'
  );
  const [projectFilter, setProjectFilter] = useState<string>(
    searchParams.get('project') || 'all'
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    const [tasksRes, projectsRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/projects'),
    ]);
    setTasks(await tasksRes.json());
    setProjects(await projectsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTasks = tasks.filter(t => {
    if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
    return true;
  });

  const getTasksByStatus = (status: TaskStatus) => 
    filteredTasks.filter(t => t.status === status);

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-zinc-500">
            {filteredTasks.length} tasks
            {assigneeFilter !== 'all' && ` for ${assigneeFilter === 'spencer' ? 'Spencer' : 'ClawdBot'}`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
          {(['all', 'spencer', 'clawdbot'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAssigneeFilter(a)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                assigneeFilter === a ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
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

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.value} className="bg-zinc-900/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">{col.label}</h3>
              <span className="text-xs text-zinc-500">{getTasksByStatus(col.value).length}</span>
            </div>
            
            <div className="space-y-2">
              {getTasksByStatus(col.value).map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  projects={projects}
                  onMove={moveTask}
                />
              ))}
              
              {getTasksByStatus(col.value).length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onSave={load}
        />
      )}
    </div>
  );
}

function TaskCard({ 
  task, 
  projects,
  onMove,
}: { 
  task: Task; 
  projects: Project[];
  onMove: (id: string, status: TaskStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const project = projects.find(p => p.id === task.project_id);
  const colorStyle = project ? PROJECT_COLORS[project.color] || PROJECT_COLORS.blue : '';

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 cursor-pointer hover:border-zinc-600 transition-colors">
      <div onClick={() => setExpanded(!expanded)}>
        {/* Header badges */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
          {project && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorStyle}`}>
              {project.name}
            </span>
          )}
          <span className="text-[10px] text-zinc-500 ml-auto">
            {task.assignee === 'spencer' ? '👤' : '🤖'}
          </span>
        </div>
        
        {/* Title */}
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        
        {/* Meta */}
        {(task.due_date || task.estimated_minutes) && (
          <div className="flex gap-2 mt-2 text-[10px] text-zinc-500">
            {task.due_date && <span>📅 {task.due_date}</span>}
            {task.estimated_minutes && <span>⏱ {task.estimated_minutes}m</span>}
          </div>
        )}
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
          {task.description && (
            <p className="text-xs text-zinc-400">{task.description}</p>
          )}
          
          <p className="text-[10px] text-zinc-500">{AUTONOMY_LABELS[task.autonomy]}</p>

          {/* Move buttons */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_COLUMNS.filter(s => s.value !== task.status).map(s => (
              <button
                key={s.value}
                onClick={(e) => { e.stopPropagation(); onMove(task.id, s.value); }}
                className="text-[10px] px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
              >
                → {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddTaskModal({ 
  projects, 
  onClose, 
  onSave 
}: { 
  projects: Project[]; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignee, setAssignee] = useState<Assignee>('clawdbot');
  const [priority, setPriority] = useState<Priority>('P2');
  const [autonomy, setAutonomy] = useState('do-then-review');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setSaving(true);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId || null,
        assignee,
        priority,
        autonomy,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        due_date: dueDate || null,
      }),
    });
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              >
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as Assignee)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              >
                <option value="spencer">👤 Spencer</option>
                <option value="clawdbot">🤖 ClawdBot</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              >
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Medium</option>
                <option value="P3">P3 - Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Autonomy Level</label>
              <select
                value={autonomy}
                onChange={(e) => setAutonomy(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              >
                <option value="full">🟢 Full Autonomy</option>
                <option value="do-then-review">🟡 Do Then Review</option>
                <option value="discuss-first">🔴 Discuss First</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Estimated (min)</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium transition-colors"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
