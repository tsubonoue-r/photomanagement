'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Album, AlbumListResponse } from '@/types/album';

/**
 * Album Management Page
 *
 * Displays list of albums for a project with options to:
 * - View album list
 * - Create new album
 * - Delete albums
 * - Navigate to album detail
 */
export default function AlbumsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [creating, setCreating] = useState(false);

  /**
   * Fetch albums for the project
   */
  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/albums?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }

      const data: AlbumListResponse = await response.json();
      setAlbums(data.albums);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load albums');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  /**
   * Create new album
   */
  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newAlbumTitle,
          description: newAlbumDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create album');
      }

      const album: Album = await response.json();
      setAlbums((prev) => [album, ...prev]);
      setShowCreateModal(false);
      setNewAlbumTitle('');
      setNewAlbumDescription('');

      // Navigate to the new album
      router.push(`/projects/${projectId}/albums/${album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create album');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Delete album
   */
  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album?')) return;

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete album');
      }

      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete album');
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: Album['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-700';
      case 'ready':
        return 'bg-blue-200 text-blue-700';
      case 'exported':
        return 'bg-green-200 text-green-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading albums...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Albums</h1>
            <p className="text-gray-600 mt-1">
              Manage photo albums for this project
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Album
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Albums List */}
        {albums.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No albums yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first album to start organizing photos
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Album Card Header */}
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: album.cover.backgroundColor || '#f3f4f6' }}
                >
                  <span className="text-4xl">📷</span>
                </div>

                {/* Album Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {album.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        album.status
                      )}`}
                    >
                      {album.status}
                    </span>
                  </div>

                  {album.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {album.description}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>{album.photos.length} photos</span>
                    <span className="mx-2">-</span>
                    <span>Updated {formatDate(album.updatedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/projects/${projectId}/albums/${album.id}`)
                      }
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDeleteAlbum(album.id)}
                      className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Album Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Create New Album
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Album Title *
                    </label>
                    <input
                      type="text"
                      value={newAlbumTitle}
                      onChange={(e) => setNewAlbumTitle(e.target.value)}
                      placeholder="Enter album title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newAlbumDescription}
                      onChange={(e) => setNewAlbumDescription(e.target.value)}
                      placeholder="Enter album description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewAlbumTitle('');
                      setNewAlbumDescription('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAlbum}
                    disabled={!newAlbumTitle.trim() || creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Album'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
