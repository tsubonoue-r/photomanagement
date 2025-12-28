'use client';

import { useState, useCallback } from 'react';
import { Album, AlbumPhoto } from '@/types/album';

interface PhotoSelectorProps {
  album: Album;
  onAddPhotos: (photoIds: string[]) => void;
  onRemovePhotos: (photoIds: string[]) => void;
  onReorderPhotos: (photoOrders: { photoId: string; order: number }[]) => void;
}

export function PhotoSelector({ album, onAddPhotos, onRemovePhotos, onReorderPhotos }: PhotoSelectorProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);

  const sortedPhotos = [...album.photos].sort((a, b) => a.order - b.order);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handleRemoveSelected = () => {
    if (selectedPhotos.size === 0) return;
    if (!confirm('Remove ' + selectedPhotos.size + ' photo(s)?')) return;
    onRemovePhotos(Array.from(selectedPhotos));
    setSelectedPhotos(new Set());
  };

  const handleAddMockPhotos = () => {
    onAddPhotos(['photo-' + Date.now() + '-1', 'photo-' + Date.now() + '-2', 'photo-' + Date.now() + '-3']);
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-gray-600">{album.photos.length} photos in album</span>
          <div className="flex items-center gap-2">
            {selectedPhotos.size > 0 && <button onClick={handleRemoveSelected} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm">Remove Selected</button>}
            <button onClick={() => setShowAddDialog(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Add Photos</button>
          </div>
        </div>
      </div>

      {sortedPhotos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
          <button onClick={() => setShowAddDialog(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add Photos</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedPhotos.map((photo, index) => (
            <div key={photo.id} className={'relative bg-white rounded-lg shadow-sm border overflow-hidden ' + (selectedPhotos.has(photo.photoId) ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200')}>
              <div className="absolute top-2 left-2 z-10">
                <input type="checkbox" checked={selectedPhotos.has(photo.photoId)} onChange={() => togglePhotoSelection(photo.photoId)} className="w-5 h-5" />
              </div>
              <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
              <div className="aspect-square bg-gray-100 flex items-center justify-center" onClick={() => togglePhotoSelection(photo.photoId)}>
                <div className="text-gray-400 text-4xl">Photo</div>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">{photo.photo.metadata.originalName || photo.photoId}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Photos to Album</h2>
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg mb-6">
                <p className="text-gray-600 mb-2">Select photos from your project</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleAddMockPhotos} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Sample Photos</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoSelector;
