'use client';

import { CATEGORIES, PRIORITIES, PROJECTS } from '@/lib/types';

interface FiltersProps {
  project: string;
  category: string;
  priority: string;
  onProjectChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
}

export default function Filters({ project, category, priority, onProjectChange, onCategoryChange, onPriorityChange }: FiltersProps) {
  const sel = "bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white";
  return (
    <div className="flex gap-2 flex-wrap">
      <select value={project} onChange={(e) => onProjectChange(e.target.value)} className={sel}>
        <option value="">All Projects</option>
        {PROJECTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={sel}>
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} className={sel}>
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
    </div>
  );
}
