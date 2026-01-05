/**
 * useOfflinePhotos Hook
 * Manages offline photo queue with auto-sync capabilities
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  offlineStorage,
  OfflinePhoto,
  OfflinePhotoInput,
} from '@/lib/offlineStorage';
import { useOnlineStatus } from '@/components/ui/OfflineIndicator';

interface UseOfflinePhotosOptions {
  projectId?: string;
  autoSync?: boolean;
  maxRetries?: number;
  syncInterval?: number;
  onSyncComplete?: (uploadedCount: number) => void;
  onSyncError?: (error: string) => void;
}

interface UseOfflinePhotosReturn {
  // State
  photos: OfflinePhoto[];
  isLoading: boolean;
  isSyncing: boolean;
  pendingCount: number;
  error: string | null;

  // Actions
  addPhoto: (photo: Omit<OfflinePhotoInput, 'id'>) => Promise<string>;
  removePhoto: (id: string) => Promise<void>;
  retryPhoto: (id: string) => Promise<void>;
  syncAll: () => Promise<void>;
  clearCompleted: () => Promise<void>;
  refreshQueue: () => Promise<void>;

  // Stats
  stats: {
    total: number;
    pending: number;
    uploading: number;
    failed: number;
    completed: number;
  };
}

export function useOfflinePhotos(
  options: UseOfflinePhotosOptions = {}
): UseOfflinePhotosReturn {
  const {
    projectId,
    autoSync = true,
    maxRetries = 3,
    syncInterval = 30000, // 30 seconds
    onSyncComplete,
    onSyncError,
  } = options;

  const isOnline = useOnlineStatus();
  const [photos, setPhotos] = useState<OfflinePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Calculate stats
  const stats = {
    total: photos.length,
    pending: photos.filter((p) => p.status === 'pending').length,
    uploading: photos.filter((p) => p.status === 'uploading').length,
    failed: photos.filter((p) => p.status === 'failed').length,
    completed: photos.filter((p) => p.status === 'completed').length,
  };

  const pendingCount = stats.pending + stats.failed;

  // Load photos from IndexedDB
  const refreshQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedPhotos = projectId
        ? await offlineStorage.getPhotosByProject(projectId)
        : await offlineStorage.getAllPhotos();
      setPhotos(storedPhotos);
      setError(null);
    } catch (err) {
      setError('キューの読み込みに失敗しました');
      console.error('Failed to load offline photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Add photo to offline queue
  const addPhoto = useCallback(
    async (photoInput: Omit<OfflinePhotoInput, 'id'>): Promise<string> => {
      const id = uuidv4();
      const photo: OfflinePhotoInput = {
        ...photoInput,
        id,
      };

      try {
        await offlineStorage.addPhoto(photo);
        await refreshQueue();
        return id;
      } catch (err) {
        setError('写真の保存に失敗しました');
        throw err;
      }
    },
    [refreshQueue]
  );

  // Remove photo from queue
  const removePhoto = useCallback(
    async (id: string) => {
      try {
        await offlineStorage.removePhoto(id);
        await refreshQueue();
      } catch (err) {
        setError('写真の削除に失敗しました');
        throw err;
      }
    },
    [refreshQueue]
  );

  // Upload a single photo
  const uploadPhoto = useCallback(
    async (photo: OfflinePhoto): Promise<boolean> => {
      try {
        // Update status to uploading
        await offlineStorage.updatePhotoStatus(photo.id, 'uploading');

        // Create form data
        const formData = new FormData();
        formData.append('file', photo.imageBlob, `photo-${photo.id}.jpg`);
        formData.append('projectId', photo.projectId);
        if (photo.categoryId) {
          formData.append('categoryId', photo.categoryId);
        }
        if (photo.title) {
          formData.append('title', photo.title);
        }
        if (photo.description) {
          formData.append('description', photo.description);
        }
        if (photo.metadata.location) {
          formData.append('latitude', String(photo.metadata.location.latitude));
          formData.append('longitude', String(photo.metadata.location.longitude));
        }

        // Upload
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        // Mark as completed
        await offlineStorage.updatePhotoStatus(photo.id, 'completed');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'アップロードに失敗しました';

        // Check retry count
        if (photo.retryCount < maxRetries) {
          await offlineStorage.updatePhotoStatus(photo.id, 'failed', errorMessage);
        } else {
          await offlineStorage.updatePhotoStatus(
            photo.id,
            'failed',
            `最大リトライ回数を超えました: ${errorMessage}`
          );
        }
        return false;
      }
    },
    [maxRetries]
  );

  // Retry failed photo
  const retryPhoto = useCallback(
    async (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (!photo || photo.status !== 'failed') return;

      // Reset to pending
      await offlineStorage.updatePhotoStatus(id, 'pending');
      await refreshQueue();

      // If online, try to upload immediately
      if (isOnline) {
        const updatedPhoto = { ...photo, status: 'pending' as const, retryCount: photo.retryCount };
        await uploadPhoto(updatedPhoto);
        await refreshQueue();
      }
    },
    [photos, isOnline, uploadPhoto, refreshQueue]
  );

  // Sync all pending photos
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const pendingPhotos = await offlineStorage.getPendingPhotos();
      let uploadedCount = 0;

      for (const photo of pendingPhotos) {
        // Skip if max retries exceeded
        if (photo.retryCount >= maxRetries) continue;

        const success = await uploadPhoto(photo);
        if (success) uploadedCount++;
      }

      await refreshQueue();
      onSyncComplete?.(uploadedCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました';
      setError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [isOnline, maxRetries, uploadPhoto, refreshQueue, onSyncComplete, onSyncError]);

  // Clear completed photos
  const clearCompleted = useCallback(async () => {
    try {
      await offlineStorage.clearCompleted();
      await refreshQueue();
    } catch (err) {
      setError('完了した写真のクリアに失敗しました');
    }
  }, [refreshQueue]);

  // Initial load
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && autoSync && pendingCount > 0) {
      syncAll();
    }
  }, [isOnline, autoSync, pendingCount, syncAll]);

  // Periodic sync when online
  useEffect(() => {
    if (!autoSync || !isOnline) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      if (pendingCount > 0) {
        syncAll();
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, isOnline, syncInterval, pendingCount, syncAll]);

  return {
    photos,
    isLoading,
    isSyncing,
    pendingCount,
    error,
    addPhoto,
    removePhoto,
    retryPhoto,
    syncAll,
    clearCompleted,
    refreshQueue,
    stats,
  };
}

export default useOfflinePhotos;
