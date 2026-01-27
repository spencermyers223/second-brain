'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Priority, Project, Status, CATEGORIES, PRIORITIES, PROJECTS, STATUSES } from '@/lib/types';

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('tasks');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('backlog');
  const [project, setProject] = useState<Project>('general');
  const [tagsStr, setTagsStr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, category, priority, status, project, tags }),
    });

    if (res.ok) {
      const item = await res.json();
      router.push(`/items/${item.id}`);
    }
    setLoading(false);
  };

  const sel = "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white w-full";

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Item</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={sel} placeholder="What's on your mind?" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Description (markdown)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={`${sel} resize-y`} placeholder="Details, links, notes..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={sel}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={sel}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={sel}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Project</label>
            <select value={project} onChange={(e) => setProject(e.target.value as Project)} className={sel}>
              {PROJECTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Tags (comma separated)</label>
          <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} className={sel} placeholder="crypto, defi, thread" />
        </div>
        <button type="submit" disabled={loading || !title.trim()} className="w-full py-3 rounded-lg bg-white text-black font-semibold disabled:opacity-50 hover:bg-zinc-200 transition-colors">
          {loading ? 'Creating...' : 'Create Item'}
        </button>
      </form>
    </div>
  );
}
