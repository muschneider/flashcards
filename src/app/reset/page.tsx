'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, ArrowLeft, Trash2, BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCards } from '@/context/CardContext';
import { clearState } from '@/lib/storage';
import { getTypeStats } from '@/lib/studyQueue';

export default function ResetPage() {
  const router = useRouter();
  const { cards, resetAll, resetProgress } = useCards();
  const [confirmed, setConfirmed] = useState<'words' | 'sentences' | 'all' | 'everything' | null>(null);

  const wordStats = getTypeStats(cards, 'word');
  const sentenceStats = getTypeStats(cards, 'sentence');

  const handleResetWords = () => {
    resetProgress('word');
    setConfirmed('words');
    setTimeout(() => { router.push('/'); }, 1500);
  };

  const handleResetSentences = () => {
    resetProgress('sentence');
    setConfirmed('sentences');
    setTimeout(() => { router.push('/'); }, 1500);
  };

  const handleResetAll = () => {
    resetAll();
    setConfirmed('all');
    setTimeout(() => { router.push('/'); }, 1500);
  };

  const handleResetEverything = () => {
    resetAll();
    clearState();
    setConfirmed('everything');
    setTimeout(() => { router.push('/'); }, 1500);
  };

  if (confirmed) {
    const messages: Record<string, string> = {
      words: 'Word Progress Reset!',
      sentences: 'Sentence Progress Reset!',
      all: 'All Progress Reset!',
      everything: 'Everything Reset!',
    };
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <RotateCcw className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {messages[confirmed]}
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

      {/* Reset Words Only */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-8 text-center dark:border-indigo-800/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reset Word Progress
        </h2>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Resets mastery and review timers for {wordStats.total} word cards.
          {wordStats.mastered > 0 && (
            <> {wordStats.mastered} mastered words will reappear in study mode.</>
          )}
          {' '}Sentence progress will not be affected.
        </p>

        <button
          onClick={handleResetWords}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Words
        </button>
      </div>

      {/* Reset Sentences Only */}
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center dark:border-emerald-800/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <MessageSquare className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reset Sentence Progress
        </h2>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Resets mastery and review timers for {sentenceStats.total} sentence cards.
          {sentenceStats.mastered > 0 && (
            <> {sentenceStats.mastered} mastered sentences will reappear in study mode.</>
          )}
          {' '}Word progress will not be affected.
        </p>

        <button
          onClick={handleResetSentences}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Sentences
        </button>
      </div>

      {/* Reset All Progress */}
      <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center dark:border-amber-800/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <RotateCcw className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reset All Progress
        </h2>

        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Clears all card mastery and review timers for both words and sentences.
          Your theme preference and session settings will be kept.
        </p>

        <button
          onClick={handleResetAll}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All Progress
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
          Clears all saved data including progress, session settings, and theme
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
