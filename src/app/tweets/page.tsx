'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TweetDraft, TWEET_STATUS_STYLES, TweetDraftStatus } from '@/lib/types';

export default function TweetsPage() {
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TweetDraftStatus | 'all'>('pending-review');

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    const url = filter === 'all' 
      ? '/api/tweet-drafts' 
      : `/api/tweet-drafts?status=${filter}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setDrafts(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const updateStatus = async (id: string, status: TweetDraftStatus, feedback?: string) => {
    const body: { status: TweetDraftStatus; feedback?: string } = { status };
    if (feedback) body.feedback = feedback;

    await fetch(`/api/tweet-drafts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    fetchDrafts();
  };

  const handleApprove = (id: string) => updateStatus(id, 'approved');
  
  const handleReject = (id: string) => {
    const feedback = prompt('Rejection reason (optional):');
    updateStatus(id, 'rejected', feedback || undefined);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-2 block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Tweet Drafts</h1>
            <p className="text-zinc-500 mt-1">Review and approve tweets before posting</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['pending-review', 'approved', 'rejected', 'posted', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === status
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Drafts List */}
        {loading ? (
          <div className="text-zinc-500 text-center py-12">Loading...</div>
        ) : drafts.length === 0 ? (
          <div className="text-zinc-500 text-center py-12">
            No tweets {filter !== 'all' ? `with status "${filter}"` : ''}
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">@{draft.target_account}</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${TWEET_STATUS_STYLES[draft.status]}`}>
                      {draft.status}
                    </span>
                  </div>
                  <span className="text-zinc-600 text-sm">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Tweet Preview */}
                <div className="bg-black rounded-lg p-4 mb-3">
                  {/* Mock X header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                      𝕏
                    </div>
                    <div>
                      <div className="font-bold">xthread</div>
                      <div className="text-zinc-500 text-sm">@{draft.target_account}</div>
                    </div>
                  </div>
                  
                  {/* Tweet content */}
                  <div className="whitespace-pre-wrap mb-3">{draft.content}</div>
                  
                  {/* Media preview */}
                  {draft.media_urls && draft.media_urls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {draft.media_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Media ${i + 1}`}
                          className="rounded-lg w-full h-40 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Character count */}
                  <div className="text-zinc-600 text-sm mt-2">
                    {draft.content.length} characters
                  </div>
                </div>

                {/* Feedback */}
                {draft.feedback && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3 text-sm">
                    <span className="text-red-400 font-medium">Feedback:</span>{' '}
                    {draft.feedback}
                  </div>
                )}

                {/* Actions */}
                {draft.status === 'pending-review' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(draft.id)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(draft.id)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {draft.status === 'approved' && (
                  <div className="text-green-400 text-sm text-center py-2">
                    ✓ Approved — Ready to post
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
