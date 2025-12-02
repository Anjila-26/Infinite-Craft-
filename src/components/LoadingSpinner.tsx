"use client";

export default function LoadingSpinner() {
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="loading-spinner" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Crafting...</span>
      </div>
    </div>
  );
}

