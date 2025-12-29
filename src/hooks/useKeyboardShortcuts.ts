'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
  enabled?: boolean;
}

/**
 * Options for the keyboard shortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  ignoreInputs?: boolean;
}

/**
 * Check if the event target is an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

/**
 * Custom hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);

  // Update ref in an effect to avoid updating during render
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore inputs if configured
      if (ignoreInputs && isInputElement(event.target)) return;

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        const altMatch = !!shortcut.alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          shortcut.handler();
          return;
        }
      }
    },
    [enabled, preventDefault, stopPropagation, ignoreInputs]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Photo gallery specific keyboard shortcuts hook
 */
export interface UsePhotoGalleryShortcutsOptions {
  photos: { id: string }[];
  selectedIds: Set<string>;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenLightbox: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}

export interface UsePhotoGalleryShortcutsReturn {
  focusedIndex: number;
  shortcuts: KeyboardShortcut[];
}

/**
 * Custom hook for photo gallery keyboard navigation
 */
export function usePhotoGalleryShortcuts(
  options: UsePhotoGalleryShortcutsOptions
): UsePhotoGalleryShortcutsReturn {
  const {
    photos,
    selectedIds,
    focusedIndex,
    onFocusChange,
    onSelect,
    onSelectAll,
    onDeselectAll,
    onOpenLightbox,
    onDelete,
    enabled = true,
  } = options;

  const moveFocus = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', columns: number = 4) => {
      if (photos.length === 0) return;

      let newIndex = focusedIndex;

      switch (direction) {
        case 'left':
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case 'right':
          newIndex = Math.min(photos.length - 1, focusedIndex + 1);
          break;
        case 'up':
          newIndex = Math.max(0, focusedIndex - columns);
          break;
        case 'down':
          newIndex = Math.min(photos.length - 1, focusedIndex + columns);
          break;
      }

      if (newIndex !== focusedIndex) {
        onFocusChange(newIndex);
      }
    },
    [photos.length, focusedIndex, onFocusChange]
  );

  const toggleCurrentSelection = useCallback(() => {
    if (photos.length === 0 || focusedIndex < 0 || focusedIndex >= photos.length) return;
    onSelect(photos[focusedIndex].id);
  }, [photos, focusedIndex, onSelect]);

  const openCurrentInLightbox = useCallback(() => {
    if (photos.length === 0 || focusedIndex < 0) return;
    onOpenLightbox();
  }, [photos.length, focusedIndex, onOpenLightbox]);

  const selectRange = useCallback(
    (direction: 'up' | 'down') => {
      if (photos.length === 0) return;

      const start = focusedIndex;
      const end = direction === 'down'
        ? Math.min(photos.length - 1, focusedIndex + 1)
        : Math.max(0, focusedIndex - 1);

      // Select all photos in range
      const minIndex = Math.min(start, end);
      const maxIndex = Math.max(start, end);

      for (let i = minIndex; i <= maxIndex; i++) {
        if (!selectedIds.has(photos[i].id)) {
          onSelect(photos[i].id);
        }
      }

      onFocusChange(end);
    },
    [photos, focusedIndex, selectedIds, onSelect, onFocusChange]
  );

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowLeft',
      handler: () => moveFocus('left'),
      description: 'Move focus left',
      enabled,
    },
    {
      key: 'ArrowRight',
      handler: () => moveFocus('right'),
      description: 'Move focus right',
      enabled,
    },
    {
      key: 'ArrowUp',
      handler: () => moveFocus('up'),
      description: 'Move focus up',
      enabled,
    },
    {
      key: 'ArrowDown',
      handler: () => moveFocus('down'),
      description: 'Move focus down',
      enabled,
    },
    {
      key: 'ArrowUp',
      shift: true,
      handler: () => selectRange('up'),
      description: 'Select range up',
      enabled,
    },
    {
      key: 'ArrowDown',
      shift: true,
      handler: () => selectRange('down'),
      description: 'Select range down',
      enabled,
    },
    {
      key: ' ',
      handler: toggleCurrentSelection,
      description: 'Toggle selection',
      enabled,
    },
    {
      key: 'Enter',
      handler: openCurrentInLightbox,
      description: 'Open in lightbox',
      enabled,
    },
    {
      key: 'a',
      ctrl: true,
      handler: onSelectAll,
      description: 'Select all',
      enabled,
    },
    {
      key: 'Escape',
      handler: onDeselectAll,
      description: 'Deselect all',
      enabled,
    },
    {
      key: 'Delete',
      handler: onDelete ?? (() => {}),
      description: 'Delete selected',
      enabled: enabled && !!onDelete && selectedIds.size > 0,
    },
    {
      key: 'Backspace',
      handler: onDelete ?? (() => {}),
      description: 'Delete selected',
      enabled: enabled && !!onDelete && selectedIds.size > 0,
    },
  ];

  useKeyboardShortcuts(shortcuts, { enabled });

  return {
    focusedIndex,
    shortcuts,
  };
}

/**
 * Get a formatted string representation of a shortcut
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');

  // Format special keys
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': '⌫',
  };

  parts.push(keyMap[shortcut.key] || shortcut.key.toUpperCase());

  return parts.join(' + ');
}

export default useKeyboardShortcuts;
