'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Album, ExportOptions, DEFAULT_EXPORT_OPTIONS } from '@/types/album';
import { AlbumEditor } from '@/components/albums/AlbumEditor';
import { PhotoSelector } from '@/components/albums/PhotoSelector';
import { ExportDialog } from '@/components/albums/ExportDialog';

/**
 * Album Detail Page
 *
 * Provides full album editing capabilities:
 * - Edit album metadata and cover
 * - Add/remove/reorder photos
 * - Configure export options
 * - Export to PDF/Excel
 */
export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const albumId = params.albumId as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'photos' | 'export'>('editor');
  const [showExportDialog, setShowExportDialog] = useState(false);

  /**
   * Fetch album data
   */
  const fetchAlbum = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/albums/${albumId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Album not found');
        }
        throw new Error('Failed to fetch album');
      }

      const data: Album = await response.json();
      setAlbum(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load album');
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  /**
   * Update album metadata
   */
  const handleUpdateAlbum = async (updates: Partial<Album>) => {
    if (!album) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update album');
      }

      const updatedAlbum: Album = await response.json();
      setAlbum(updatedAlbum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update album');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Add photos to album
   */
  const handleAddPhotos = async (photoIds: string[]) => {
    if (!album || photoIds.length === 0) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/albums/${albumId}?action=addPhotos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to add photos');
      }

      const updatedAlbum: Album = await response.json();
      setAlbum(updatedAlbum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add photos');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Remove photos from album
   */
  const handleRemovePhotos = async (photoIds: string[]) => {
    if (!album || photoIds.length === 0) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/albums/${albumId}?action=removePhotos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove photos');
      }

      const updatedAlbum: Album = await response.json();
      setAlbum(updatedAlbum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photos');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Reorder photos in album
   */
  const handleReorderPhotos = async (
    photoOrders: { photoId: string; order: number }[]
  ) => {
    if (!album) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/albums/${albumId}?action=reorderPhotos`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoOrders }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reorder photos');
      }

      const updatedAlbum: Album = await response.json();
      setAlbum(updatedAlbum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder photos');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Export album
   */
  const handleExport = async (options: ExportOptions) => {
    if (!album) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/albums/${albumId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export album');
      }

      const result = await response.json();

      if (result.success && result.url) {
        // In production, this would trigger a download
        alert(
          `Export successful!\nFilename: ${result.filename}\nPages: ${result.pageCount}\nSize: ${Math.round(result.size / 1024)} KB`
        );
        setShowExportDialog(false);
        fetchAlbum(); // Refresh to get updated export status
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export album');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading album...</div>
      </div>
    );
  }

  if (error && !album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.push(`/projects/${projectId}/albums`)}
            className="text-blue-600 hover:underline"
          >
            Back to albums
          </button>
        </div>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}/albums`)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {album.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {album.photos.length} photos
                  {album.lastExportedAt && (
                    <span>
                      {' '}
                      - Last exported{' '}
                      {new Date(album.lastExportedAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              <button
                onClick={() => setShowExportDialog(true)}
                disabled={album.photos.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'editor'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Album Settings
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Photos ({album.photos.length})
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'editor' && (
          <AlbumEditor album={album} onUpdate={handleUpdateAlbum} />
        )}

        {activeTab === 'photos' && (
          <PhotoSelector
            album={album}
            onAddPhotos={handleAddPhotos}
            onRemovePhotos={handleRemovePhotos}
            onReorderPhotos={handleReorderPhotos}
          />
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          album={album}
          onExport={handleExport}
          onClose={() => setShowExportDialog(false)}
          initialOptions={album.exportOptions || DEFAULT_EXPORT_OPTIONS}
        />
      )}
    </div>
  );
}
