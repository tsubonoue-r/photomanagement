'use client';

import { useState } from 'react';
import { CreateAlbumRequest, AlbumCover } from '@/types/album';

interface AlbumCreatorProps {
  projectId: string;
  onCreated: (albumId: string) => void;
  onCancel: () => void;
}

export function AlbumCreator({ projectId, onCreated, onCancel }: AlbumCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<Partial<AlbumCover>>({ backgroundColor: '#ffffff' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCover = (field: keyof AlbumCover, value: string) => {
    setCover((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      setCreating(true);
      const request: CreateAlbumRequest = { projectId, title: title.trim(), description: description.trim() || undefined, cover };
      const response = await fetch('/api/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      if (!response.ok) throw new Error('Failed to create album');
      const album = await response.json();
      onCreated(album.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create album');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Album</h2>
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Album Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter album title" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input type="text" value={cover.projectName || ''} onChange={(e) => updateCover('projectName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSubmit} disabled={!title.trim() || creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlbumCreator;
