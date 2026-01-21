'use client';

import { memo, useCallback, useState } from 'react';
import { Keyboard } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'ナビゲーション',
    shortcuts: [
      { keys: ['←', '→', '↑', '↓'], description: '写真間を移動' },
      { keys: ['Enter'], description: '選択した写真を拡大表示' },
      { keys: ['Esc'], description: '選択解除 / ライトボックスを閉じる' },
    ],
  },
  {
    title: '選択',
    shortcuts: [
      { keys: ['Space'], description: '写真の選択/選択解除' },
      { keys: ['Ctrl', 'A'], description: '全て選択' },
      { keys: ['Shift', '↑'], description: '上方向に範囲選択' },
      { keys: ['Shift', '↓'], description: '下方向に範囲選択' },
    ],
  },
  {
    title: 'ライトボックス',
    shortcuts: [
      { keys: ['←'], description: '前の写真' },
      { keys: ['→'], description: '次の写真' },
      { keys: ['i'], description: '写真情報の表示/非表示' },
      { keys: ['Esc'], description: '閉じる' },
    ],
  },
  {
    title: 'その他',
    shortcuts: [
      { keys: ['?'], description: 'ショートカットヘルプを表示' },
      { keys: ['Delete'], description: '選択した写真を削除' },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keyboard shortcuts help modal component
 */
export const KeyboardShortcutsHelp = memo<KeyboardShortcutsHelpProps>(
  function KeyboardShortcutsHelp({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="キーボードショートカット"
      >
        <div
          className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Keyboard className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                キーボードショートカット
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              aria-label="閉じる"
            >
              <svg
                className="h-5 w-5"
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

          {/* Shortcut groups */}
          <div className="grid gap-6 md:grid-cols-2">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-700/50"
                    >
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            {keyIndex > 0 && (
                              <span className="mx-1 text-zinc-400">+</span>
                            )}
                            <kbd className="inline-flex min-w-[28px] items-center justify-center rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-sm text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              <kbd className="mx-1 rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-700">
                ?
              </kbd>
              を押すとこのヘルプを表示できます
            </p>
          </div>
        </div>
      </div>
    );
  }
);

/**
 * Keyboard shortcuts button with help modal
 */
interface KeyboardShortcutsButtonProps {
  className?: string;
}

export const KeyboardShortcutsButton = memo<KeyboardShortcutsButtonProps>(
  function KeyboardShortcutsButton({ className = '' }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = useCallback(() => {
      setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
      setIsOpen(false);
    }, []);

    return (
      <>
        <button
          onClick={handleOpen}
          className={`flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm
            text-zinc-600 transition-colors hover:bg-zinc-50
            dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700 ${className}`}
          aria-label="キーボードショートカットを表示"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">ショートカット</span>
          <kbd className="hidden rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs sm:inline-block dark:border-zinc-600 dark:bg-zinc-700">
            ?
          </kbd>
        </button>
        <KeyboardShortcutsHelp isOpen={isOpen} onClose={handleClose} />
      </>
    );
  }
);

export default KeyboardShortcutsHelp;
