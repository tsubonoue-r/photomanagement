'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Album, AlbumPhoto } from '@/types/album';

interface PhotoSelectorProps {
  album: Album;
  onAddPhotos: (photoIds: string[]) => void;
  onRemovePhotos: (photoIds: string[]) => void;
  onReorderPhotos: (photoOrders: { photoId: string; order: number }[]) => void;
}

interface AvailablePhoto {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}

/**
 * Sortable Photo Item Component
 */
function SortablePhotoItem({
  photo,
  index,
  isSelected,
  onSelect,
  onToggleBlackboard,
}: {
  photo: AlbumPhoto;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleBlackboard: (photo: AlbumPhoto) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-10 z-10 bg-white bg-opacity-80 p-1 rounded cursor-grab active:cursor-grabbing"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(photo.id)}
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
        className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer relative"
        onClick={() => onSelect(photo.id)}
      >
        {photo.thumbnailUrl ? (
          <Image
            src={photo.thumbnailUrl}
            alt={photo.title || `Photo ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="text-gray-400 text-4xl">IMG</div>
        )}
      </div>

      {/* Photo Info */}
      <div className="p-2">
        <p className="text-xs text-gray-500 truncate">{photo.title || photo.id}</p>
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBlackboard(photo);
            }}
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
  );
}

/**
 * Drag Overlay Photo Component
 */
function DragOverlayPhoto({ photo, index }: { photo: AlbumPhoto; index: number }) {
  return (
    <div className="bg-white rounded-lg shadow-xl border-2 border-blue-600 overflow-hidden w-40">
      <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
        {index + 1}
      </div>
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
        {photo.thumbnailUrl ? (
          <Image
            src={photo.thumbnailUrl}
            alt={photo.title}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="text-gray-400 text-4xl">IMG</div>
        )}
      </div>
    </div>
  );
}

/**
 * Photo Selector Component
 *
 * Manages photos in an album:
 * - View current photos
 * - Add new photos from project
 * - Remove photos
 * - Reorder photos via drag-and-drop (using dnd-kit)
 */
export function PhotoSelector({
  album,
  onAddPhotos,
  onRemovePhotos,
  onReorderPhotos,
}: PhotoSelectorProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState<AvailablePhoto[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  // Sort photos by order
  const sortedPhotos = [...album.photos].sort((a, b) => a.order - b.order);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Fetch available photos from project
   */
  const fetchAvailablePhotos = useCallback(async () => {
    if (!album.id) return;

    try {
      setLoadingAvailable(true);
      const response = await fetch(`/api/albums/${album.id}/photos`);
      if (response.ok) {
        const data = await response.json();
        setAvailablePhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Failed to fetch available photos:', error);
    } finally {
      setLoadingAvailable(false);
    }
  }, [album.id]);

  useEffect(() => {
    if (showAddDialog) {
      fetchAvailablePhotos();
    }
  }, [showAddDialog, fetchAvailablePhotos]);

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
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedPhotos.findIndex((p) => p.id === active.id);
      const newIndex = sortedPhotos.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(sortedPhotos, oldIndex, newIndex);
      const photoOrders = newOrder.map((photo, index) => ({
        photoId: photo.id,
        order: index,
      }));

      onReorderPhotos(photoOrders);
    }

    setActiveId(null);
  };

  /**
   * Toggle blackboard for photo
   */
  const toggleBlackboard = (photo: AlbumPhoto) => {
    // This would call the API to update photo settings
    alert(`Toggle blackboard for photo: ${photo.title || photo.id}`);
  };

  /**
   * Toggle selection for adding
   */
  const toggleAddSelection = (photoId: string) => {
    setSelectedToAdd((prev) => {
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
   * Add selected photos
   */
  const handleAddSelectedPhotos = () => {
    if (selectedToAdd.size === 0) return;
    onAddPhotos(Array.from(selectedToAdd));
    setSelectedToAdd(new Set());
    setShowAddDialog(false);
  };

  const activePhoto = activeId
    ? sortedPhotos.find((p) => p.id === activeId)
    : null;
  const activeIndex = activeId
    ? sortedPhotos.findIndex((p) => p.id === activeId)
    : -1;

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

      {/* Photo Grid with DnD */}
      {sortedPhotos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">IMG</div>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedPhotos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedPhotos.map((photo, index) => (
                <SortablePhotoItem
                  key={photo.id}
                  photo={photo}
                  index={index}
                  isSelected={selectedPhotos.has(photo.id)}
                  onSelect={togglePhotoSelection}
                  onToggleBlackboard={toggleBlackboard}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activePhoto && (
              <DragOverlayPhoto photo={activePhoto} index={activeIndex} />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Drag Hint */}
      {sortedPhotos.length > 1 && (
        <p className="text-center text-sm text-gray-500">
          Drag photos to reorder them in the album
        </p>
      )}

      {/* Add Photos Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Add Photos to Album
                </h2>
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedToAdd(new Set());
                  }}
                  className="text-gray-400 hover:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {selectedToAdd.size > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  {selectedToAdd.size} photo(s) selected
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingAvailable ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading photos...</p>
                </div>
              ) : availablePhotos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 text-5xl mb-4">IMG</div>
                  <p className="text-gray-600 mb-2">
                    No more photos available to add
                  </p>
                  <p className="text-sm text-gray-500">
                    All project photos are already in this album
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {availablePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => toggleAddSelection(photo.id)}
                      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedToAdd.has(photo.id)
                          ? 'ring-2 ring-blue-600 ring-offset-2'
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                    >
                      {selectedToAdd.has(photo.id) && (
                        <div className="absolute top-1 right-1 z-10 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                        {photo.thumbnailUrl ? (
                          <Image
                            src={photo.thumbnailUrl}
                            alt={photo.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                          />
                        ) : (
                          <div className="text-gray-400 text-2xl">IMG</div>
                        )}
                      </div>
                      <div className="p-1.5 bg-white">
                        <p className="text-xs text-gray-600 truncate">
                          {photo.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedToAdd(new Set());
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelectedPhotos}
                  disabled={selectedToAdd.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedToAdd.size > 0 ? `${selectedToAdd.size} ` : ''}
                  Photo{selectedToAdd.size !== 1 ? 's' : ''}
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
