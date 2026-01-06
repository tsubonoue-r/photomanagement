'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { hapticMedium, hapticLight } from '@/lib/capacitor/haptics';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'red' | 'orange';
}

interface FloatingActionButtonProps {
  /** メインボタンクリック時のアクション（actionsがない場合） */
  onClick?: () => void;
  /** 展開時のアクション一覧 */
  actions?: FABAction[];
  /** メインボタンのアイコン */
  icon?: React.ReactNode;
  /** 位置 */
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  /** ラベル */
  label?: string;
}

export function FloatingActionButton({
  onClick,
  actions,
  icon = <Plus className="w-6 h-6" />,
  position = 'bottom-right',
  label,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    hapticMedium();
    if (actions && actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    hapticLight();
    action.onClick();
    setIsExpanded(false);
  };

  const positionClasses = {
    'bottom-right': 'right-4 bottom-24 lg:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6',
    'bottom-left': 'left-4 bottom-24 lg:bottom-6',
  };

  const actionColorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
  };

  return (
    <div className={`fixed z-40 ${positionClasses[position]}`}>
      {/* Expanded actions */}
      {actions && isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsExpanded(false)}
          />

          {/* Actions */}
          <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-3">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Label */}
                <span className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap">
                  {action.label}
                </span>

                {/* Action button */}
                <button
                  onClick={() => handleActionClick(action)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 ${
                    actionColorClasses[action.color || 'blue']
                  }`}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Main FAB */}
      <button
        onClick={handleMainClick}
        aria-label={isExpanded ? 'メニューを閉じる' : label || 'メニューを開く'}
        aria-expanded={actions && actions.length > 0 ? isExpanded : undefined}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-90 ${
          isExpanded
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        {isExpanded ? <X className="w-6 h-6" /> : icon}
      </button>

      {/* Label (when not expanded) */}
      {label && !isExpanded && (
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      )}
    </div>
  );
}
