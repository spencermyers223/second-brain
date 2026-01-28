'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type === 'application/pdf') return '📄';
  if (type.includes('svg')) return '🎨';
  return '📎';
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'other'>('all');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        setFiles(await res.json());
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await loadFiles();
      } else {
        const data = await res.json();
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    try {
      const res = await fetch(`/api/files?name=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFiles(files.filter(f => f.name !== fileName));
        if (preview?.name === fileName) setPreview(null);
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredFiles = files.filter(f => {
    if (filter === 'images' && !f.type.startsWith('image/')) return false;
    if (filter === 'videos' && !f.type.startsWith('video/')) return false;
    if (filter === 'other' && (f.type.startsWith('image/') || f.type.startsWith('video/'))) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                ← Back
              </Link>
              <h1 className="text-lg font-semibold">📁 Files</h1>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {files.length} files · {formatBytes(totalSize)}
              </span>
            </div>
            <label className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? 'Uploading...' : '+ Upload'}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            {(['all', 'images', 'videos', 'other'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === f
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'images' ? '🖼️ Images' : f === 'videos' ? '🎬 Videos' : '📎 Other'}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-zinc-500">
              {search ? 'No files match your search' : 'No files yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map(file => (
              <div
                key={file.id || file.name}
                className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Preview */}
                <button
                  onClick={() => setPreview(file)}
                  className="w-full aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden"
                >
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : file.type.startsWith('video/') ? (
                    <video src={file.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <span className="text-4xl">{getFileIcon(file.type)}</span>
                  )}
                </button>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm text-zinc-200 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-zinc-500">{formatBytes(file.size)}</span>
                    <span className="text-xs text-zinc-600">
                      {file.createdAt ? formatDistanceToNow(file.createdAt) : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.url}
                      download={file.name}
                      className="flex-1 text-center text-xs py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="px-3 text-xs py-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-zinc-900 rounded-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-200">{preview.name}</p>
                <p className="text-xs text-zinc-500">{formatBytes(preview.size)} · {preview.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={preview.url}
                  download={preview.name}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto flex items-center justify-center">
              {preview.type.startsWith('image/') ? (
                <img src={preview.url} alt={preview.name} className="max-w-full max-h-[70vh] object-contain" />
              ) : preview.type.startsWith('video/') ? (
                <video src={preview.url} controls className="max-w-full max-h-[70vh]" />
              ) : (
                <div className="text-center py-10">
                  <span className="text-6xl">{getFileIcon(preview.type)}</span>
                  <p className="mt-4 text-zinc-400">Preview not available</p>
                  <a
                    href={preview.url}
                    download={preview.name}
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
