'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useCards } from '@/context/CardContext';
import { getDueCards, shuffle } from '@/lib/studyUtils';
import { FlashCard, SentenceCard as SentenceCardType } from '@/lib/types';
import SentenceCard from '@/components/SentenceCard';

export default function StudySentencesPage() {
  const router = useRouter();
  const { sentenceCards, markCorrect, markWrong } = useCards();

  const [queue, setQueue] = useState<SentenceCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  // Initialize study session
  useEffect(() => {
    const dueCards = getDueCards(sentenceCards as FlashCard[])
      .filter((c): c is SentenceCardType => c.type === 'sentence');
    const shuffled = shuffle(dueCards);
    setQueue(shuffled);
    setSessionTotal(shuffled.length);
    setCurrentIndex(0);
    setCompleted(0);
    setIsComplete(shuffled.length === 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCard = queue[currentIndex] || null;

  const advanceToNext = useCallback(() => {
    setCompleted((prev) => prev + 1);
    setCardKey((prev) => prev + 1);

    if (currentIndex + 1 >= queue.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, queue.length]);

  const handleCorrect = useCallback(() => {
    if (!currentCard) return;
    markCorrect(currentCard.id);
    advanceToNext();
  }, [currentCard, markCorrect, advanceToNext]);

  const handleWrong = useCallback(() => {
    if (!currentCard) return;
    markWrong(currentCard.id);

    // Re-insert the card later in the queue
    setQueue((prev) => {
      const newQueue = [...prev];
      const reinsertAt = Math.min(currentIndex + 4, newQueue.length);
      newQueue.splice(reinsertAt, 0, currentCard);
      return newQueue;
    });
    setSessionTotal((prev) => prev + 1);
    setCardKey((prev) => prev + 1);
    setCurrentIndex((prev) => prev + 1);
  }, [currentCard, markWrong, currentIndex]);

  // Empty state
  if (isComplete && sessionTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PartyPopper className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          No sentences to study!
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          All sentence cards are mastered. Check back later for reviews, or add new sentences.
        </p>
        <Link
          href="/study"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Study
        </Link>
      </div>
    );
  }

  // Session complete
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PartyPopper className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Session Complete!
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          You reviewed {completed} sentence{completed !== 1 ? 's' : ''} in this session.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.refresh()}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Study Again
          </button>
          <Link
            href="/study"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Study Modes
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
          href="/study"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Study Modes
        </Link>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Sentence {Math.min(completed + 1, sessionTotal)} of {sessionTotal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
          style={{
            width: `${sessionTotal > 0 ? (completed / sessionTotal) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Current card */}
      {currentCard && (
        <SentenceCard
          key={cardKey}
          card={currentCard}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      )}
    </div>
  );
}
