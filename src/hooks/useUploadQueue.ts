/**
 * Upload Queue Hook
 * Advanced upload queue management with retry, duplicate detection, and progress tracking
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  UploadQueueItem,
  UploadQueueItemStatus,
  UploadQueueStats,
  UploadQueueConfig,
  UseUploadQueueReturn,
  DEFAULT_UPLOAD_QUEUE_CONFIG,
  DuplicateCheckResult,
} from '@/types/upload';
import { UploadedPhoto } from '@/types/photo';

interface UseUploadQueueOptions {
  /** Configuration overrides */
  config?: Partial<UploadQueueConfig>;
  /** Callback when upload completes */
  onUploadComplete?: (photos: UploadedPhoto[]) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string, item: UploadQueueItem) => void;
  /** Callback when duplicate detected */
  onDuplicateDetected?: (item: UploadQueueItem, original: DuplicateCheckResult) => void;
  /** Callback when queue processing completes */
  onQueueComplete?: (stats: UploadQueueStats) => void;
  /** Project ID for upload context */
  projectId?: string;
  /** Category ID for upload context */
  categoryId?: string;
}

/**
 * Calculate file hash for duplicate detection
 */
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create preview URL for file
 */
function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 */
function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export function useUploadQueue(
  options: UseUploadQueueOptions = {}
): UseUploadQueueReturn {
  const {
    config: configOverrides,
    onUploadComplete,
    onUploadError,
    onDuplicateDetected,
    onQueueComplete,
    projectId,
    categoryId,
  } = options;

  // Merge config with defaults
  const config = useMemo<UploadQueueConfig>(
    () => ({ ...DEFAULT_UPLOAD_QUEUE_CONFIG, ...configOverrides }),
    [configOverrides]
  );

  // Queue state
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);

  // Refs for tracking
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const uploadStartTimes = useRef<Map<string, number>>(new Map());
  const uploadedBytesHistory = useRef<{ time: number; bytes: number }[]>([]);
  const knownHashes = useRef<Map<string, { id: string; filename: string }>>(new Map());

  /**
   * Calculate queue statistics
   */
  const stats = useMemo<UploadQueueStats>(() => {
    const statusCounts = items.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<UploadQueueItemStatus, number>
    );

    const totalBytes = items.reduce((acc, item) => acc + item.fileSize, 0);
    const uploadedBytes = items.reduce((acc, item) => {
      if (item.status === 'completed') return acc + item.fileSize;
      if (item.status === 'uploading') return acc + (item.fileSize * item.progress) / 100;
      return acc;
    }, 0);

    // Calculate upload speed from recent history
    const recentHistory = uploadedBytesHistory.current.filter(
      (h) => Date.now() - h.time < 5000
    );
    let uploadSpeed: number | undefined;
    if (recentHistory.length >= 2) {
      const oldest = recentHistory[0];
      const newest = recentHistory[recentHistory.length - 1];
      const timeDiff = (newest.time - oldest.time) / 1000;
      const bytesDiff = newest.bytes - oldest.bytes;
      uploadSpeed = timeDiff > 0 ? bytesDiff / timeDiff : undefined;
    }

    // Estimate time remaining
    let estimatedTimeRemaining: number | undefined;
    if (uploadSpeed && uploadSpeed > 0) {
      const remainingBytes = totalBytes - uploadedBytes;
      estimatedTimeRemaining = remainingBytes / uploadSpeed;
    }

    const completedItems = statusCounts.completed || 0;
    const totalItems = items.length;
    const overallProgress =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      total: items.length,
      queued: statusCounts.queued || 0,
      uploading: statusCounts.uploading || 0,
      processing: statusCounts.processing || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.error || 0,
      cancelled: statusCounts.cancelled || 0,
      duplicates: statusCounts.duplicate || 0,
      overallProgress,
      totalBytes,
      uploadedBytes,
      estimatedTimeRemaining,
      uploadSpeed,
    };
  }, [items]);

  /**
   * Update a queue item
   */
  const updateItem = useCallback(
    (id: string, updates: Partial<UploadQueueItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  /**
   * Check for duplicate file
   */
  const checkDuplicate = useCallback(
    async (file: File, hash: string): Promise<DuplicateCheckResult> => {
      if (!config.enableDuplicateDetection) {
        return { isDuplicate: false };
      }

      // Check against known hashes
      const existing = knownHashes.current.get(hash);
      if (existing) {
        return {
          isDuplicate: true,
          originalId: existing.id,
          originalFilename: existing.filename,
          confidence: 1.0,
        };
      }

      // Check against current queue
      const queueDuplicate = items.find(
        (item) => item.fileHash === hash && item.status !== 'cancelled'
      );
      if (queueDuplicate) {
        return {
          isDuplicate: true,
          originalId: queueDuplicate.id,
          originalFilename: queueDuplicate.filename,
          confidence: 1.0,
        };
      }

      return { isDuplicate: false };
    },
    [config.enableDuplicateDetection, items]
  );

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (item: UploadQueueItem): Promise<void> => {
      const controller = new AbortController();
      abortControllers.current.set(item.id, controller);
      uploadStartTimes.current.set(item.id, Date.now());

      try {
        updateItem(item.id, { status: 'uploading', startedAt: new Date(), progress: 0 });

        const formData = new FormData();
        formData.append('files', item.file);
        if (projectId) formData.append('projectId', projectId);
        if (categoryId) formData.append('categoryId', categoryId);

        // Use XMLHttpRequest for progress tracking
        const result = await new Promise<{ success: boolean; photo?: UploadedPhoto; error?: string }>(
          (resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                updateItem(item.id, { progress });

                // Track upload bytes for speed calculation
                uploadedBytesHistory.current.push({
                  time: Date.now(),
                  bytes: event.loaded,
                });
                // Keep only last 10 seconds of history
                uploadedBytesHistory.current = uploadedBytesHistory.current.filter(
                  (h) => Date.now() - h.time < 10000
                );
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  if (response.success && response.results?.[0]?.success) {
                    resolve({ success: true, photo: response.results[0].photo });
                  } else {
                    const error =
                      response.results?.[0]?.error || response.error || 'Upload failed';
                    resolve({ success: false, error });
                  }
                } catch {
                  resolve({ success: false, error: 'Invalid server response' });
                }
              } else {
                resolve({ success: false, error: `HTTP error: ${xhr.status}` });
              }
            });

            xhr.addEventListener('error', () => {
              resolve({ success: false, error: 'Network error' });
            });

            xhr.addEventListener('abort', () => {
              resolve({ success: false, error: 'Upload cancelled' });
            });

            controller.signal.addEventListener('abort', () => {
              xhr.abort();
            });

            xhr.open('POST', '/api/photos/upload');
            xhr.send(formData);
          }
        );

        if (result.success && result.photo) {
          updateItem(item.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
            uploadedPhoto: result.photo,
          });

          // Register hash for duplicate detection
          if (item.fileHash) {
            knownHashes.current.set(item.fileHash, {
              id: result.photo.id,
              filename: item.filename,
            });
          }

          setUploadedPhotos((prev) => [...prev, result.photo!]);
          onUploadComplete?.([result.photo]);
        } else {
          const shouldRetry =
            item.retryCount < item.maxRetries &&
            config.autoRetryOnNetworkError &&
            result.error?.includes('Network');

          if (shouldRetry) {
            // Schedule retry
            setTimeout(() => {
              updateItem(item.id, {
                status: 'queued',
                retryCount: item.retryCount + 1,
                error: undefined,
              });
            }, config.retryDelay);
          } else {
            updateItem(item.id, {
              status: 'error',
              error: result.error,
            });
            onUploadError?.(result.error || 'Unknown error', item);
          }
        }
      } catch (error) {
        updateItem(item.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        onUploadError?.(
          error instanceof Error ? error.message : 'Unknown error',
          item
        );
      } finally {
        abortControllers.current.delete(item.id);
        uploadStartTimes.current.delete(item.id);
      }
    },
    [
      updateItem,
      projectId,
      categoryId,
      config.autoRetryOnNetworkError,
      config.retryDelay,
      onUploadComplete,
      onUploadError,
    ]
  );

  /**
   * Process the upload queue
   */
  const processQueue = useCallback(async () => {
    if (isPaused) return;

    const queuedItems = items.filter((item) => item.status === 'queued');
    const uploadingCount = items.filter((item) => item.status === 'uploading').length;
    const availableSlots = config.maxConcurrent - uploadingCount;

    if (availableSlots <= 0 || queuedItems.length === 0) return;

    const itemsToUpload = queuedItems.slice(0, availableSlots);

    await Promise.all(itemsToUpload.map((item) => uploadFile(item)));
  }, [items, isPaused, config.maxConcurrent, uploadFile]);

  /**
   * Effect to process queue when items change
   */
  useEffect(() => {
    const hasQueuedItems = items.some((item) => item.status === 'queued');
    const hasUploadingItems = items.some((item) => item.status === 'uploading');

    setIsProcessing(hasQueuedItems || hasUploadingItems);

    if (hasQueuedItems && !isPaused) {
      processQueue();
    }

    // Check if queue is complete
    if (items.length > 0 && !hasQueuedItems && !hasUploadingItems) {
      const hasProcessing = items.some((item) => item.status === 'processing');
      if (!hasProcessing) {
        onQueueComplete?.(stats);
      }
    }
  }, [items, isPaused, processQueue, onQueueComplete, stats]);

  /**
   * Cleanup preview URLs on unmount
   */
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) {
          revokePreviewUrl(item.previewUrl);
        }
      });
    };
  }, [items]);

  /**
   * Add files to the queue
   */
  const addFiles = useCallback(
    async (files: File[]) => {
      const newItems: UploadQueueItem[] = [];

      for (const file of files) {
        // Validate file type
        if (!config.allowedMimeTypes.includes(file.type.toLowerCase())) {
          continue;
        }

        // Validate file size
        if (file.size > config.maxFileSize) {
          continue;
        }

        const id = uuidv4();
        const hash = config.enableDuplicateDetection
          ? await calculateFileHash(file)
          : undefined;

        // Check for duplicates
        let status: UploadQueueItemStatus = 'queued';
        let duplicateOfId: string | undefined;

        if (hash) {
          const duplicateCheck = await checkDuplicate(file, hash);
          if (duplicateCheck.isDuplicate) {
            status = 'duplicate';
            duplicateOfId = duplicateCheck.originalId;
            onDuplicateDetected?.(
              {
                id,
                file,
                filename: file.name,
                fileSize: file.size,
                status,
                progress: 0,
                retryCount: 0,
                maxRetries: config.maxRetries,
                fileHash: hash,
                previewUrl: createPreviewUrl(file),
                addedAt: new Date(),
                duplicateOfId,
              },
              duplicateCheck
            );
          }
        }

        const newItem: UploadQueueItem = {
          id,
          file,
          filename: file.name,
          fileSize: file.size,
          status,
          progress: 0,
          retryCount: 0,
          maxRetries: config.maxRetries,
          fileHash: hash,
          previewUrl: createPreviewUrl(file),
          addedAt: new Date(),
          duplicateOfId,
        };

        newItems.push(newItem);
      }

      setItems((prev) => [...prev, ...newItems]);
    },
    [config, checkDuplicate, onDuplicateDetected]
  );

  /**
   * Remove an item from the queue
   */
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        revokePreviewUrl(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });

    // Abort if uploading
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
    }
  }, []);

  /**
   * Retry a failed upload
   */
  const retryItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id && (item.status === 'error' || item.status === 'cancelled')
            ? { ...item, status: 'queued' as const, retryCount: item.retryCount + 1, error: undefined }
            : item
        )
      );
    },
    []
  );

  /**
   * Retry all failed uploads
   */
  const retryAllFailed = useCallback(() => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === 'error'
          ? { ...item, status: 'queued' as const, retryCount: item.retryCount + 1, error: undefined }
          : item
      )
    );
  }, []);

  /**
   * Cancel an upload
   */
  const cancelItem = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
    }
    updateItem(id, { status: 'cancelled', error: 'Upload cancelled' });
  }, [updateItem]);

  /**
   * Cancel all uploads
   */
  const cancelAll = useCallback(() => {
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();

    setItems((prev) =>
      prev.map((item) =>
        item.status === 'uploading' || item.status === 'queued'
          ? { ...item, status: 'cancelled' as const, error: 'Upload cancelled' }
          : item
      )
    );
  }, []);

  /**
   * Clear completed items
   */
  const clearCompleted = useCallback(() => {
    setItems((prev) => {
      prev
        .filter((item) => item.status === 'completed')
        .forEach((item) => {
          if (item.previewUrl) revokePreviewUrl(item.previewUrl);
        });
      return prev.filter((item) => item.status !== 'completed');
    });
  }, []);

  /**
   * Clear failed items
   */
  const clearFailed = useCallback(() => {
    setItems((prev) => {
      prev
        .filter((item) => item.status === 'error')
        .forEach((item) => {
          if (item.previewUrl) revokePreviewUrl(item.previewUrl);
        });
      return prev.filter((item) => item.status !== 'error');
    });
  }, []);

  /**
   * Clear all items
   */
  const clearAll = useCallback(() => {
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();

    setItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) revokePreviewUrl(item.previewUrl);
      });
      return [];
    });
  }, []);

  /**
   * Pause queue processing
   */
  const pauseQueue = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume queue processing
   */
  const resumeQueue = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * Skip duplicate and remove from queue
   */
  const skipDuplicate = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  /**
   * Replace duplicate with new file
   */
  const replaceDuplicate = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id && item.status === 'duplicate'
            ? { ...item, status: 'queued' as const, duplicateOfId: undefined }
            : item
        )
      );
    },
    []
  );

  return {
    items,
    stats,
    actions: {
      addFiles,
      removeItem,
      retryItem,
      retryAllFailed,
      cancelItem,
      cancelAll,
      clearCompleted,
      clearFailed,
      clearAll,
      pauseQueue,
      resumeQueue,
      skipDuplicate,
      replaceDuplicate,
    },
    isProcessing,
    isPaused,
    uploadedPhotos,
  };
}
