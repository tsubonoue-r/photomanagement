'use client';

import { ArrowLeft } from 'lucide-react';

/**
 * GoBackButton component
 * A client-side button that navigates back in browser history
 */
export function GoBackButton() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <button
      type="button"
      onClick={handleGoBack}
      className="
        inline-flex items-center gap-2 px-6 py-3
        bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
        text-gray-700 dark:text-gray-300
        font-medium rounded-lg
        border border-gray-300 dark:border-gray-600
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
      "
    >
      <ArrowLeft className="w-5 h-5" />
      Go back
    </button>
  );
}
