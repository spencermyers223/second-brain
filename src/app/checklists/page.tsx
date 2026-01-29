'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChecklistItem, Project, PROJECT_COLORS } from '@/lib/types';

export default function ChecklistsPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const load = useCallback(async () => {
    const [itemsRes, projectsRes] = await Promise.all([
      fetch('/api/checklists'),
      fetch('/api/projects'),
    ]);
    setItems(await itemsRes.json());
    setProjects(await projectsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredItems = projectFilter === 'all' 
    ? items 
    : items.filter(i => i.project_id === projectFilter);

  const shortTerm = filteredItems.filter(i => i.type === 'short-term');
  const longTerm = filteredItems.filter(i => i.type === 'long-term');

  const toggleItem = async (id: string, completed: boolean) => {
    await fetch(`/api/checklists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    load();
  };

  const addItem = async (title: string, type: 'short-term' | 'long-term', dueDate?: string) => {
    await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        type, 
        project_id: projectFilter === 'all' ? null : projectFilter,
        due_date: dueDate || null,
      }),
    });
    load();
  };

  const promoteItem = async (id: string) => {
    await fetch(`/api/checklists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'short-term' }),
    });
    load();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/checklists/${id}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Checklists</h1>
          <p className="text-zinc-500">Track weekly tasks and long-term goals</p>
        </div>
        
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Short Term */}
        <ChecklistSection
          title="📅 This Week"
          subtitle="Immediate action items"
          items={shortTerm}
          type="short-term"
          projects={projects}
          onToggle={toggleItem}
          onAdd={addItem}
          onDelete={deleteItem}
        />

        {/* Long Term */}
        <ChecklistSection
          title="🎯 Long Term"
          subtitle="Goals and milestones"
          items={longTerm}
          type="long-term"
          projects={projects}
          onToggle={toggleItem}
          onAdd={addItem}
          onDelete={deleteItem}
          onPromote={promoteItem}
        />
      </div>
    </div>
  );
}

function ChecklistSection({
  title,
  subtitle,
  items,
  type,
  projects,
  onToggle,
  onAdd,
  onDelete,
  onPromote,
}: {
  title: string;
  subtitle: string;
  items: ChecklistItem[];
  type: 'short-term' | 'long-term';
  projects: Project[];
  onToggle: (id: string, completed: boolean) => void;
  onAdd: (title: string, type: 'short-term' | 'long-term', dueDate?: string) => void;
  onDelete: (id: string) => void;
  onPromote?: (id: string) => void;
}) {
  const [newItem, setNewItem] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const incomplete = items.filter(i => !i.completed);
  const completed = items.filter(i => i.completed);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    onAdd(newItem.trim(), type, newDueDate || undefined);
    setNewItem('');
    setNewDueDate('');
    setShowAdd(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 p-3 bg-zinc-800 rounded-lg space-y-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={type === 'short-term' ? 'Task for this week...' : 'Long-term goal...'}
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-sm"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          {type === 'short-term' && (
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-sm"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-1.5 text-sm text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 rounded"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Incomplete items */}
      <div className="space-y-2">
        {incomplete.map((item) => {
          const project = projects.find(p => p.id === item.project_id);
          const colorStyle = project ? PROJECT_COLORS[project.color] : '';
          
          return (
            <div key={item.id} className="flex items-center gap-3 group">
              <button
                onClick={() => onToggle(item.id, true)}
                className="w-5 h-5 rounded border-2 border-zinc-600 hover:border-emerald-500 flex items-center justify-center transition-colors"
              />
              <span className="flex-1 text-sm">{item.title}</span>
              {project && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorStyle}`}>
                  {project.name}
                </span>
              )}
              {item.due_date && (
                <span className={`text-xs ${isOverdue(item.due_date) ? 'text-red-400' : 'text-zinc-500'}`}>
                  {item.due_date}
                </span>
              )}
              <div className="hidden group-hover:flex gap-1">
                {onPromote && (
                  <button
                    onClick={() => onPromote(item.id)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                    title="Move to This Week"
                  >
                    ↑
                  </button>
                )}
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
        
        {incomplete.length === 0 && (
          <p className="text-sm text-zinc-600 py-2">No items</p>
        )}
      </div>

      {/* Completed items */}
      {completed.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 mb-2">Completed ({completed.length})</p>
          <div className="space-y-2">
            {completed.map((item) => (
              <div key={item.id} className="flex items-center gap-3 group opacity-50">
                <button
                  onClick={() => onToggle(item.id, false)}
                  className="w-5 h-5 rounded border-2 border-emerald-600 bg-emerald-600/20 flex items-center justify-center"
                >
                  <span className="text-emerald-400 text-xs">✓</span>
                </button>
                <span className="flex-1 text-sm line-through">{item.title}</span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="hidden group-hover:block text-xs text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toDateString());
}
