'use client';

import { useState } from 'react';

export default function QuickCaptureButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSaving(true);
    try {
      await fetch('/api/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110 z-40"
        title="Quick capture"
      >
        +
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Quick Capture</h2>
            <form onSubmit={handleSubmit}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Idea, bug, task, anything..."
                rows={3}
                autoFocus
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !content.trim()}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Capture'}
                </button>
              </div>
            </form>
            <p className="text-xs text-zinc-500 mt-3">
              ClawdBot will triage this into the right place.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
