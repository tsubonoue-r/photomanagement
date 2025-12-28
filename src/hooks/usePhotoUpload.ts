/**
 * Photo Upload Hook
 * Manages file upload state, progress, and API calls
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  UploadProgress,
  UploadResult,
  UploadedPhoto,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/types/photo';

interface UsePhotoUploadOptions {
  onUploadComplete?: (photos: UploadedPhoto[]) => void;
  onUploadError?: (error: string) => void;
  maxConcurrent?: number;
}

interface UsePhotoUploadReturn {
  uploadFiles: (files: File[]) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  cancelAll: () => void;
  clearCompleted: () => void;
  progress: UploadProgress[];
  isUploading: boolean;
  uploadedPhotos: UploadedPhoto[];
}

export function usePhotoUpload(
  options: UsePhotoUploadOptions = {}
): UsePhotoUploadReturn {
  const {
    onUploadComplete,
    onUploadError,
    maxConcurrent = 3,
  } = options;

  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      return `File "${file.name}" has unsupported type. Allowed: JPEG, PNG, HEIC`;
    }

    return null;
  }, []);

  /**
   * Update progress for a specific file
   */
  const updateProgress = useCallback(
    (fileId: string, updates: Partial<UploadProgress>) => {
      setProgress((prev) =>
        prev.map((p) => (p.fileId === fileId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  /**
   * Upload a single file
   */
  const uploadSingleFile = useCallback(
    async (file: File, fileId: string): Promise<UploadResult> => {
      const controller = new AbortController();
      abortControllers.current.set(fileId, controller);

      try {
        updateProgress(fileId, { status: 'uploading', progress: 0 });

        const formData = new FormData();
        formData.append('files', file);

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round(
                (event.loaded / event.total) * 100
              );
              updateProgress(fileId, { progress: percentComplete });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success && response.results?.[0]?.success) {
                  updateProgress(fileId, {
                    status: 'completed',
                    progress: 100,
                  });
                  resolve({
                    success: true,
                    photo: response.results[0].photo,
                  });
                } else {
                  const error = response.results?.[0]?.error || response.error || 'Upload failed';
                  updateProgress(fileId, { status: 'error', error });
                  resolve({ success: false, error });
                }
              } catch {
                updateProgress(fileId, {
                  status: 'error',
                  error: 'Invalid response',
                });
                resolve({ success: false, error: 'Invalid response' });
              }
            } else {
              const error = `HTTP error: ${xhr.status}`;
              updateProgress(fileId, { status: 'error', error });
              resolve({ success: false, error });
            }
          });

          xhr.addEventListener('error', () => {
            const error = 'Network error';
            updateProgress(fileId, { status: 'error', error });
            resolve({ success: false, error });
          });

          xhr.addEventListener('abort', () => {
            updateProgress(fileId, {
              status: 'error',
              error: 'Upload cancelled',
            });
            resolve({ success: false, error: 'Upload cancelled' });
          });

          // Store reference to abort
          controller.signal.addEventListener('abort', () => {
            xhr.abort();
          });

          xhr.open('POST', '/api/photos/upload');
          xhr.send(formData);
        });
      } finally {
        abortControllers.current.delete(fileId);
      }
    },
    [updateProgress]
  );

  /**
   * Upload multiple files with concurrency control
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploading(true);

      // Validate all files first
      const validFiles: { file: File; fileId: string }[] = [];
      const initialProgress: UploadProgress[] = [];

      for (const file of files) {
        const fileId = uuidv4();
        const validationError = validateFile(file);

        if (validationError) {
          initialProgress.push({
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: validationError,
          });
        } else {
          validFiles.push({ file, fileId });
          initialProgress.push({
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'pending',
          });
        }
      }

      setProgress((prev) => [...prev, ...initialProgress]);

      // Upload with concurrency control
      const uploadQueue = [...validFiles];
      const results: UploadResult[] = [];
      const activeUploads = new Set<Promise<void>>();

      const processNext = async () => {
        while (uploadQueue.length > 0 && activeUploads.size < maxConcurrent) {
          const item = uploadQueue.shift();
          if (!item) break;

          const uploadPromise = (async () => {
            const result = await uploadSingleFile(item.file, item.fileId);
            results.push(result);
          })();

          activeUploads.add(uploadPromise);
          uploadPromise.finally(() => {
            activeUploads.delete(uploadPromise);
            processNext();
          });
        }
      };

      await processNext();

      // Wait for all uploads to complete
      while (activeUploads.size > 0) {
        await Promise.race(activeUploads);
      }

      // Collect successful uploads
      const successfulPhotos = results
        .filter((r): r is UploadResult & { photo: UploadedPhoto } =>
          r.success && r.photo !== undefined
        )
        .map((r) => r.photo);

      if (successfulPhotos.length > 0) {
        setUploadedPhotos((prev) => [...prev, ...successfulPhotos]);
        onUploadComplete?.(successfulPhotos);
      }

      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount > 0) {
        onUploadError?.(`${failedCount} file(s) failed to upload`);
      }

      setIsUploading(false);
    },
    [validateFile, uploadSingleFile, maxConcurrent, onUploadComplete, onUploadError]
  );

  /**
   * Cancel a specific upload
   */
  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
    }
  }, []);

  /**
   * Cancel all active uploads
   */
  const cancelAll = useCallback(() => {
    abortControllers.current.forEach((controller) => {
      controller.abort();
    });
    abortControllers.current.clear();
    setIsUploading(false);
  }, []);

  /**
   * Clear completed and errored uploads from progress
   */
  const clearCompleted = useCallback(() => {
    setProgress((prev) =>
      prev.filter((p) => p.status === 'pending' || p.status === 'uploading')
    );
  }, []);

  return {
    uploadFiles,
    cancelUpload,
    cancelAll,
    clearCompleted,
    progress,
    isUploading,
    uploadedPhotos,
  };
}
