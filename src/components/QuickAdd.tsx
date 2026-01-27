'use client';

import { useState } from 'react';
import { Category, Priority, Project, CATEGORIES, PRIORITIES, PROJECTS } from '@/lib/types';

interface QuickAddProps {
  onAdded?: () => void;
}

export default function QuickAdd({ onAdded }: QuickAddProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('tasks');
  const [priority, setPriority] = useState<Priority>('medium');
  const [project, setProject] = useState<Project>('general');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), category, priority, project, status: 'backlog' }),
    });

    setTitle('');
    setCategory('tasks');
    setPriority('medium');
    setProject('general');
    setLoading(false);
    setOpen(false);
    onAdded?.();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 md:bottom-6 md:right-6 z-50 bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-zinc-200 transition-colors"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">Quick Add</h2>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
        <div className="grid grid-cols-3 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white">
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={project} onChange={(e) => setProject(e.target.value as Project)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white">
            {PROJECTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading || !title.trim()} className="flex-1 py-2.5 rounded-lg bg-white text-black font-medium disabled:opacity-50 hover:bg-zinc-200 transition-colors">
            {loading ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
