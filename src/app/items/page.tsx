'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrainItem, getPriorityStyle, getProjectStyle, STATUSES } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';
import Filters from '@/components/Filters';
import QuickAdd from '@/components/QuickAdd';

export default function ItemsPage() {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [search, setSearch] = useState('');
  const [project, setProject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'title'>('created_at');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (project) params.set('project', project);
    if (category) params.set('category', category);
    if (priority) params.set('priority', priority);
    if (search) params.set('search', search);
    const res = await fetch(`/api/items?${params}`);
    setItems(await res.json());
  }, [project, category, priority, search]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">All Items</h1>
        <span className="text-sm text-zinc-500">{items.length} items</span>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 flex-1 md:max-w-xs"
        />
        <Filters
          project={project} category={category} priority={priority}
          onProjectChange={setProject} onCategoryChange={setCategory} onPriorityChange={setPriority}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white">
          <option value="created_at">Newest</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div className="space-y-1">
        {sorted.map((item) => (
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-zinc-900 transition-colors group"
          >
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>
              {item.priority[0].toUpperCase()}
            </span>
            <span className="text-sm text-white flex-1 truncate group-hover:text-white">{item.title}</span>
            <span className={`hidden md:inline text-[10px] px-1.5 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>
              {item.project}
            </span>
            <span className="hidden md:inline text-xs text-zinc-600">{item.category}</span>
            <span className="text-xs text-zinc-600">
              {STATUSES.find((s) => s.value === item.status)?.label}
            </span>
            <span className="text-xs text-zinc-700 hidden md:inline">{formatDistanceToNow(item.created_at)}</span>
          </Link>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-lg mb-2">No items found</p>
            <Link href="/items/new" className="text-sm text-white hover:underline">Create one →</Link>
          </div>
        )}
      </div>

      <QuickAdd onAdded={load} />
    </div>
  );
}
