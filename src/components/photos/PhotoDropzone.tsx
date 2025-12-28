/**
 * Photo Dropzone Component
 * Provides drag-and-drop file upload functionality
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';

interface PhotoDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
  children?: React.ReactNode;
}

export function PhotoDropzone({
  onFilesSelected,
  disabled = false,
  maxFiles = 20,
  className = '',
  children,
}: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  /**
   * Filter and validate files
   */
  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const files = Array.from(fileList);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        // Check file type
        const mimeType = file.type.toLowerCase();
        if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
          errors.push(`"${file.name}" is not a supported image type`);
          continue;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(
            `"${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
          );
          continue;
        }

        validFiles.push(file);
      }

      // Check max files
      if (validFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        validFiles.splice(maxFiles);
      }

      if (errors.length > 0) {
        setDragError(errors.join('. '));
        setTimeout(() => setDragError(null), 5000);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [maxFiles, onFilesSelected]
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
        setIsDragging(true);
        setDragError(null);
      }
    },
    [disabled]
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      dragCounter.current = 0;

      if (disabled) return;

      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  /**
   * Open file dialog
   */
  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const baseClasses = `
    relative rounded-lg border-2 border-dashed
    transition-all duration-200 ease-in-out
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    ${
      isDragging
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
    }
  `;

  return (
    <div
      className={`${baseClasses} ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFileDialog}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFileDialog();
        }
      }}
      aria-label="Drop photos here or click to select"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {children || (
        <div className="flex flex-col items-center justify-center p-8">
          {/* Upload Icon */}
          <svg
            className={`w-12 h-12 mb-4 ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {isDragging ? (
            <p className="text-lg font-medium text-blue-500">
              Drop your photos here
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

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            JPEG, PNG, HEIC up to {MAX_FILE_SIZE / 1024 / 1024}MB
          </p>
        </div>
      )}

      {/* Error message */}
      {dragError && (
        <div className="absolute bottom-2 left-2 right-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400 text-sm">
          {dragError}
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
