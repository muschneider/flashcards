'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCards } from '@/context/CardContext';
import { clearState } from '@/lib/storage';

export default function ResetPage() {
  const router = useRouter();
  const { resetAll, stats } = useCards();
  const [confirmed, setConfirmed] = useState<'progress' | 'everything' | null>(null);

  const handleResetProgress = () => {
    resetAll();
    // clearState not called — the save effect in providers.tsx will
    // persist the reset progress (all zeroes) along with the current theme
    setConfirmed('progress');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleResetEverything = () => {
    resetAll();
    clearState();
    setConfirmed('everything');
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
          {confirmed === 'everything' ? 'Everything Reset!' : 'Progress Reset!'}
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

      {/* Reset Progress Only */}
      <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center dark:border-amber-800/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <RotateCcw className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reset Progress Only
        </h2>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Clears all card mastery and review timers for your {stats.total} cards.
          All {stats.mastered} mastered cards will reappear in study mode.
          Your theme preference will be kept.
        </p>

        <button
          onClick={handleResetProgress}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Progress
        </button>
      </div>

      {/* Reset Everything */}
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-800/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reset Everything
        </h2>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Clears all saved data including progress, review timers, and theme
          preference. Reverts everything to factory defaults.
        </p>

        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          This action cannot be undone.
        </p>

        <button
          onClick={handleResetEverything}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Reset Everything
        </button>
      </div>

      <Link
        href="/"
        className="block rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        Cancel
      </Link>
    </div>
  );
}
