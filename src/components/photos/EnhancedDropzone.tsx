/**
 * Enhanced Dropzone Component
 * Improved drag-and-drop with better visual feedback
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';

interface EnhancedDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
  children?: React.ReactNode;
  /** Show file count when dragging */
  showDragCount?: boolean;
  /** Custom accept types */
  acceptTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
}

type DragState = 'idle' | 'dragover' | 'invalid' | 'success';

interface ValidationError {
  filename: string;
  message: string;
}

export function EnhancedDropzone({
  onFilesSelected,
  disabled = false,
  maxFiles = 50,
  className = '',
  children,
  showDragCount = true,
  acceptTypes = [...ALLOWED_MIME_TYPES],
  maxFileSize = MAX_FILE_SIZE,
}: EnhancedDropzoneProps) {
  const [dragState, setDragState] = useState<DragState>('idle');
  const [dragCount, setDragCount] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  /**
   * Validate and filter files
   */
  const processFiles = useCallback(
    (fileList: FileList | null): File[] => {
      if (!fileList) return [];

      const files = Array.from(fileList);
      const validFiles: File[] = [];
      const newErrors: ValidationError[] = [];

      for (const file of files) {
        // Check file type
        const mimeType = file.type.toLowerCase();
        if (!acceptTypes.includes(mimeType)) {
          newErrors.push({
            filename: file.name,
            message: 'Unsupported file type',
          });
          continue;
        }

        // Check file size
        if (file.size > maxFileSize) {
          newErrors.push({
            filename: file.name,
            message: `File exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`,
          });
          continue;
        }

        validFiles.push(file);
      }

      // Check max files limit
      if (validFiles.length > maxFiles) {
        newErrors.push({
          filename: `${validFiles.length - maxFiles} files`,
          message: `Maximum ${maxFiles} files allowed`,
        });
        validFiles.splice(maxFiles);
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => setErrors([]), 5000);
      }

      return validFiles;
    },
    [acceptTypes, maxFileSize, maxFiles]
  );

  /**
   * Handle files after validation
   */
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      const validFiles = processFiles(fileList);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
        setShowSuccess(true);
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 2000);
      }
    },
    [processFiles, onFilesSelected]
  );

  /**
   * Check if drag contains valid file types
   */
  const checkDragValidity = useCallback(
    (dataTransfer: DataTransfer): boolean => {
      if (dataTransfer.items) {
        for (const item of Array.from(dataTransfer.items)) {
          if (item.kind === 'file') {
            const type = item.type.toLowerCase();
            if (type && acceptTypes.includes(type)) {
              return true;
            }
          }
        }
      }
      return true; // Default to true if we can't determine
    },
    [acceptTypes]
  );

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounter.current++;

      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const isValid = checkDragValidity(e.dataTransfer);
        setDragState(isValid ? 'dragover' : 'invalid');
        setDragCount(e.dataTransfer.items.length);
        setErrors([]);
      }
    },
    [disabled, checkDragValidity]
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragState('idle');
      setDragCount(0);
    }
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) {
        e.dataTransfer.dropEffect = 'none';
      } else {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled]
  );

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounter.current = 0;
      setDragCount(0);

      if (disabled) {
        setDragState('idle');
        return;
      }

      handleFiles(e.dataTransfer.files);
      setDragState('idle');
    },
    [disabled, handleFiles]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  /**
   * Open file dialog
   */
  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog]
  );

  // Compute styles based on drag state
  const stateStyles = {
    idle: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-900',
    dragover:
      'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-4 ring-blue-500/20 scale-[1.02]',
    invalid:
      'border-red-400 bg-red-50 dark:bg-red-900/20 ring-4 ring-red-400/20',
    success:
      'border-green-500 bg-green-50 dark:bg-green-900/20 ring-4 ring-green-500/20',
  };

  const currentState = showSuccess ? 'success' : dragState;

  return (
    <div
      className={`
        relative rounded-xl border-2 border-dashed
        transition-all duration-200 ease-out
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${stateStyles[currentState]}
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFileDialog}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label="Drop photos here or click to select"
      aria-disabled={disabled}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {children || (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
          {/* Icon */}
          <div
            className={`
              relative mb-4 p-4 rounded-full
              transition-all duration-200
              ${
                dragState === 'dragover'
                  ? 'bg-blue-100 dark:bg-blue-900/50 scale-110'
                  : dragState === 'invalid'
                  ? 'bg-red-100 dark:bg-red-900/50'
                  : showSuccess
                  ? 'bg-green-100 dark:bg-green-900/50'
                  : 'bg-gray-100 dark:bg-gray-800'
              }
            `}
          >
            {showSuccess ? (
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : dragState === 'invalid' ? (
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className={`w-10 h-10 transition-colors ${
                  dragState === 'dragover' ? 'text-blue-500' : 'text-gray-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}

            {/* Animated ring on dragover */}
            {dragState === 'dragover' && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-50" />
            )}
          </div>

          {/* Text Content */}
          {showSuccess ? (
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              Files added successfully!
            </p>
          ) : dragState === 'dragover' ? (
            <>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                Drop your photos here
              </p>
              {showDragCount && dragCount > 0 && (
                <p className="mt-1 text-sm text-blue-500 dark:text-blue-400">
                  {dragCount} {dragCount === 1 ? 'file' : 'files'} selected
                </p>
              )}
            </>
          ) : dragState === 'invalid' ? (
            <p className="text-lg font-medium text-red-600 dark:text-red-400">
              Unsupported file type
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Drag and drop photos here
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                or click to select files
              </p>
            </>
          )}

          {/* File type hints */}
          {dragState === 'idle' && !showSuccess && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                JPEG
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                PNG
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                HEIC
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                up to {Math.round(maxFileSize / (1024 * 1024))}MB
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Toast */}
      {errors.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 p-3 bg-red-100 dark:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {errors.length === 1
                  ? 'Upload error'
                  : `${errors.length} upload errors`}
              </p>
              <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                {errors.slice(0, 3).map((error, index) => (
                  <li key={index} className="truncate">
                    {error.filename}: {error.message}
                  </li>
                ))}
                {errors.length > 3 && (
                  <li>...and {errors.length - 3} more</li>
                )}
              </ul>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setErrors([]);
              }}
              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss errors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
