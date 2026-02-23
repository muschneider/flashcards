'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCards } from '@/context/CardContext';

export default function ResetPage() {
  const router = useRouter();
  const { resetAll, stats } = useCards();
  const [confirmed, setConfirmed] = useState(false);

  const handleReset = () => {
    resetAll();
    setConfirmed(true);
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <RotateCcw className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Progress Reset!
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-800/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reset All Progress
        </h1>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          This will reset all progress for your {stats.total} cards. All{' '}
          {stats.mastered} mastered cards will reappear in study mode. Review
          timers will be cleared.
        </p>

        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          This action cannot be undone.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            onClick={handleReset}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
