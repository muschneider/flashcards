'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageSquare, Shuffle } from 'lucide-react';
import { useCards } from '@/context/CardContext';
import { buildStudyQueue } from '@/lib/studyQueue';

const ModeCard = dynamic(() => import('@/components/ModeCard'), { ssr: false });

export default function StudyPage() {
  const { cards, wordCards, sentenceCards } = useCards();

  const wordStats = buildStudyQueue({
    type: 'word',
    allCards: cards,
    cardsPerSession: Infinity,
  });
  const sentenceStats = buildStudyQueue({
    type: 'sentence',
    allCards: cards,
    cardsPerSession: Infinity,
  });

  const allDue = wordStats.length + sentenceStats.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Choose Study Mode
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Select which type of cards you want to practice
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ModeCard
          href="/study/words"
          icon={<BookOpen className="h-8 w-8" />}
          title="Words"
          description="Practice vocabulary with multiple choice"
          color="indigo"
          dueCount={wordStats.length}
          totalCount={wordCards.length}
        />
        <ModeCard
          href="/study/sentences"
          icon={<MessageSquare className="h-8 w-8" />}
          title="Sentences"
          description="Arrange words to form correct sentences"
          color="emerald"
          dueCount={sentenceStats.length}
          totalCount={sentenceCards.length}
        />
        <ModeCard
          href="/study/all"
          icon={<Shuffle className="h-8 w-8" />}
          title="All Cards"
          description="Mix words and sentences together"
          color="purple"
          dueCount={allDue}
          totalCount={cards.length}
        />
      </div>
    </div>
  );
}
