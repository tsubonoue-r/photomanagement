'use client';

import { useCallback, useEffect, useState, memo } from 'react';
import Image from 'next/image';
import type { Photo } from '@/types/photo';
import { WORK_TYPE_LABELS, PHOTO_CATEGORY_LABELS } from '@/types/photo';

interface PhotoLightboxProps {
  photo: Photo | null;
  photos: Photo[];
  onClose: () => void;
  onNavigate: (photo: Photo) => void;
}

export const PhotoLightbox = memo<PhotoLightboxProps>(function PhotoLightbox({
  photo,
  photos,
  onClose,
  onNavigate,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const currentIndex = photo ? photos.findIndex((p) => p.id === photo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setIsLoading(true);
      onNavigate(photos[currentIndex - 1]);
    }
  }, [currentIndex, hasPrev, photos, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setIsLoading(true);
      onNavigate(photos[currentIndex + 1]);
    }
  }, [currentIndex, hasNext, photos, onNavigate]);

  const toggleInfo = useCallback(() => {
    setShowInfo((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'i':
          toggleInfo();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose, goToPrev, goToNext, toggleInfo]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (photo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [photo]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      {/* Close button */}
      <button
        className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white
          transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Info toggle button */}
      <button
        className={`absolute right-4 top-16 z-50 rounded-full p-2 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white ${showInfo ? 'bg-blue-500' : 'bg-white/10 hover:bg-white/20'}`}
        onClick={(e) => { e.stopPropagation(); toggleInfo(); }}
        aria-label="Toggle photo info"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Navigation: Previous */}
      {hasPrev && (
        <button
          className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          aria-label="Previous photo"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Navigation: Next */}
      {hasNext && (
        <button
          className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          aria-label="Next photo"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Photo container */}
      <div className="relative flex h-full w-full items-center justify-center p-16" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        )}

        <div className="relative h-full w-full">
          <Image
            src={photo.url}
            alt={photo.description || photo.filename}
            fill
            sizes="100vw"
            className="object-contain"
            priority
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Photo info panel */}
        {showInfo && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-4 text-xl font-semibold">{photo.filename}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                {photo.description && (
                  <div className="col-span-2">
                    <span className="text-zinc-400">Description:</span>
                    <p className="mt-1">{photo.description}</p>
                  </div>
                )}
                {photo.takenAt && (
                  <div>
                    <span className="text-zinc-400">Taken:</span>
                    <p className="mt-1">{new Date(photo.takenAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
                {photo.workType && (
                  <div>
                    <span className="text-zinc-400">Work Type:</span>
                    <p className="mt-1">{WORK_TYPE_LABELS[photo.workType]}</p>
                  </div>
                )}
                {photo.category && (
                  <div>
                    <span className="text-zinc-400">Category:</span>
                    <p className="mt-1">{PHOTO_CATEGORY_LABELS[photo.category]}</p>
                  </div>
                )}
                {photo.location && (
                  <div>
                    <span className="text-zinc-400">Location:</span>
                    <p className="mt-1">{photo.location}</p>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400">Size:</span>
                  <p className="mt-1">{photo.width} x {photo.height}</p>
                </div>
                <div>
                  <span className="text-zinc-400">File Size:</span>
                  <p className="mt-1">{(photo.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {photo.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-zinc-400">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {photo.tags.map((tag) => (
                        <span key={tag} className="rounded bg-white/20 px-2 py-1 text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 right-4 text-xs text-white/50">
        <span className="mr-4">Arrows: Navigate</span>
        <span className="mr-4">i: Info</span>
        <span>ESC: Close</span>
      </div>
    </div>
  );
});

export default PhotoLightbox;
