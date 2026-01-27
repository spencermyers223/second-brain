'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Attachment, BrainItem, Category, Priority, Project, Status, CATEGORIES, PRIORITIES, PROJECTS, STATUSES, getPriorityStyle, getProjectStyle } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/utils';
import AttachmentUploader from '@/components/AttachmentUploader';
import AttachmentGallery from '@/components/AttachmentGallery';

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<BrainItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('tasks');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('backlog');
  const [project, setProject] = useState<Project>('general');
  const [tagsStr, setTagsStr] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setItem(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setCategory(data.category);
        setPriority(data.priority);
        setStatus(data.status);
        setProject(data.project);
        setTagsStr((data.tags || []).join(', '));
        setAttachments(data.attachments || []);
        setLoading(false);
      });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await fetch(`/api/items/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, category, priority, status, project, tags, attachments }),
    });
    if (res.ok) {
      setItem(await res.json());
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/items/${params.id}`, { method: 'DELETE' });
    router.push('/items');
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;
  if (!item) return <div className="p-8 text-zinc-500">Item not found</div>;

  const sel = "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white w-full";

  if (editing) {
    return (
      <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold">Edit Item</h1>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={sel} />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className={`${sel} resize-y`} />
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
          <label className="block text-sm text-zinc-400 mb-1.5">Tags</label>
          <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} className={sel} />
        </div>
        <AttachmentUploader attachments={attachments} onChange={setAttachments} />
        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-white text-black font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityStyle(item.priority)}`}>{item.priority}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getProjectStyle(item.project)}`}>{item.project}</span>
            <span className="text-xs text-zinc-500">{STATUSES.find((s) => s.value === item.status)?.label}</span>
          </div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors">Edit</button>
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg border border-red-900 text-red-400 hover:bg-red-900/20 transition-colors">Delete</button>
        </div>
      </div>

      <div className="text-xs text-zinc-600">
        {CATEGORIES.find((c) => c.value === item.category)?.label} · Created {formatDistanceToNow(item.created_at)} · Updated {formatDistanceToNow(item.updated_at)}
      </div>

      {item.description && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{item.description}</p>
        </div>
      )}

      {item.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {item.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-lg">{t}</span>
          ))}
        </div>
      )}

      <AttachmentGallery attachments={item.attachments || []} />

      {/* Quick status change */}
      <div>
        <p className="text-sm text-zinc-500 mb-2">Move to:</p>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.filter((s) => s.value !== item.status).map((s) => (
            <button
              key={s.value}
              onClick={async () => {
                const res = await fetch(`/api/items/${item.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: s.value, position: item.position }),
                });
                if (res.ok) setItem(await res.json());
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
