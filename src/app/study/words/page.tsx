'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PartyPopper, RotateCcw, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useCards } from '@/context/CardContext';
import { generateWordOptions } from '@/lib/studyUtils';
import { WordCard as WordCardType } from '@/lib/types';
import { useStudySession } from '@/hooks/useStudySession';
import WordCard from '@/components/WordCard';

export default function StudyWordsPage() {
  const router = useRouter();
  const { cards, wordCards, settings, resetProgress } = useCards();

  const {
    currentCard,
    completed,
    correctOnFirst,
    needReview,
    sessionTotal,
    isComplete,
    cardKey,
    handleCorrect,
    handleWrong,
  } = useStudySession({
    queueOptions: {
      type: 'word',
      allCards: cards,
      cardsPerSession: settings.words.cardsPerSession,
    },
  });

  const typedCard = currentCard?.type === 'word' ? (currentCard as WordCardType) : null;

  // Generate options for word cards
  const wordOptions = useMemo(() => {
    if (!typedCard) return [];
    return generateWordOptions(typedCard, wordCards);
  }, [typedCard, wordCards]);

  // Empty state — all cards seen/mastered
  if (isComplete && sessionTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PartyPopper className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          No cards left for this session!
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          All words have been seen or mastered.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              resetProgress('word');
              router.refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-200 bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800/50 dark:bg-gray-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Word Progress
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Session complete — summary screen
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PartyPopper className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Session Complete!
        </h2>
        <div className="mt-4 space-y-2">
          <p className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
            Words studied: <span className="font-bold">{completed}</span>
          </p>
          <p className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            Correct on first try: <span className="font-bold">{correctOnFirst}</span>
          </p>
          {needReview > 0 && (
            <p className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Need review: <span className="font-bold">{needReview}</span>
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Word {Math.min(completed + 1, sessionTotal)} of {sessionTotal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{
            width: `${sessionTotal > 0 ? (completed / sessionTotal) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Current card */}
      {typedCard && (
        <WordCard
          key={cardKey}
          card={typedCard}
          options={wordOptions}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      )}
    </div>
  );
}
