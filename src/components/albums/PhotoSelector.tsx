'use client';

import { useState, useCallback } from 'react';
import { Album, AlbumPhoto } from '@/types/album';

interface PhotoSelectorProps {
  album: Album;
  onAddPhotos: (photoIds: string[]) => void;
  onRemovePhotos: (photoIds: string[]) => void;
  onReorderPhotos: (photoOrders: { photoId: string; order: number }[]) => void;
}

/**
 * Photo Selector Component
 *
 * Manages photos in an album:
 * - View current photos
 * - Add new photos
 * - Remove photos
 * - Reorder photos via drag-and-drop
 */
export function PhotoSelector({
  album,
  onAddPhotos,
  onRemovePhotos,
  onReorderPhotos,
}: PhotoSelectorProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Sort photos by order
  const sortedPhotos = [...album.photos].sort((a, b) => a.order - b.order);

  /**
   * Toggle photo selection
   */
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  /**
   * Select all photos
   */
  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(album.photos.map((p) => p.id)));
  };

  /**
   * Deselect all photos
   */
  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  /**
   * Remove selected photos
   */
  const handleRemoveSelected = () => {
    if (selectedPhotos.size === 0) return;
    if (!confirm(`Remove ${selectedPhotos.size} selected photo(s) from album?`)) {
      return;
    }
    onRemovePhotos(Array.from(selectedPhotos));
    setSelectedPhotos(new Set());
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (photoId: string) => {
    setDraggedPhoto(photoId);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (targetPhotoId: string) => {
      if (!draggedPhoto || draggedPhoto === targetPhotoId) {
        setDraggedPhoto(null);
        return;
      }

      const draggedIndex = sortedPhotos.findIndex(
        (p) => p.id === draggedPhoto
      );
      const targetIndex = sortedPhotos.findIndex(
        (p) => p.id === targetPhotoId
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedPhoto(null);
        return;
      }

      // Create new order
      const newPhotos = [...sortedPhotos];
      const [removed] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(targetIndex, 0, removed);

      // Generate new orders
      const photoOrders = newPhotos.map((photo, index) => ({
        photoId: photo.id,
        order: index,
      }));

      onReorderPhotos(photoOrders);
      setDraggedPhoto(null);
    },
    [draggedPhoto, sortedPhotos, onReorderPhotos]
  );

  /**
   * Toggle blackboard for photo
   */
  const toggleBlackboard = async (photo: AlbumPhoto) => {
    // This would call the API to update photo settings
    // For now, we'll just show a message
    alert(`Toggle blackboard for photo ${photo.id}`);
  };

  /**
   * Mock add photos (in production, this would open a photo picker)
   */
  const handleAddMockPhotos = () => {
    const mockPhotoIds = [
      `photo-${Date.now()}-1`,
      `photo-${Date.now()}-2`,
      `photo-${Date.now()}-3`,
    ];
    onAddPhotos(mockPhotoIds);
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {album.photos.length} photos in album
            </span>
            {selectedPhotos.size > 0 && (
              <span className="text-blue-600 font-medium">
                {selectedPhotos.size} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedPhotos.size > 0 ? (
              <>
                <button
                  onClick={deselectAllPhotos}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  Deselect All
                </button>
                <button
                  onClick={handleRemoveSelected}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  Remove Selected
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={selectAllPhotos}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  Select All
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
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
              Add Photos
            </button>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      {sortedPhotos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📷</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No photos yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add photos to this album to get started
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Photos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedPhotos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(photo.id)}
              className={`relative bg-white rounded-lg shadow-sm border overflow-hidden cursor-move transition-all ${
                selectedPhotos.has(photo.id)
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${draggedPhoto === photo.id ? 'opacity-50' : ''}`}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedPhotos.has(photo.id)}
                  onChange={() => togglePhotoSelection(photo.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Order Number */}
              <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Photo Thumbnail */}
              <div
                className="aspect-square bg-gray-100 flex items-center justify-center"
                onClick={() => togglePhotoSelection(photo.id)}
              >
                {photo.thumbnailUrl ? (
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.title || `Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-4xl">📷</div>
                )}
              </div>

              {/* Photo Info */}
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">
                  {photo.title || photo.id}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <button
                    onClick={() => toggleBlackboard(photo)}
                    className={`text-xs px-2 py-0.5 rounded ${
                      photo.blackboardInfo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {photo.blackboardInfo ? 'BB On' : 'BB Off'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag Hint */}
      {sortedPhotos.length > 1 && (
        <p className="text-center text-sm text-gray-500">
          Drag and drop to reorder photos
        </p>
      )}

      {/* Add Photos Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Photos to Album
              </h2>

              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg mb-6">
                <div className="text-gray-400 text-5xl mb-4">📷</div>
                <p className="text-gray-600 mb-2">
                  Select photos from your project
                </p>
                <p className="text-sm text-gray-500">
                  In production, this would show a photo picker
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMockPhotos}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Sample Photos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoSelector;
