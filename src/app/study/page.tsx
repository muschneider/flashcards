'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageSquare, Shuffle } from 'lucide-react';
import { useCards } from '@/context/CardContext';
import { getDueCards } from '@/lib/studyUtils';
import { FlashCard } from '@/lib/types';

export default function StudyPage() {
  const { cards, wordCards, sentenceCards } = useCards();

  const dueAll = getDueCards(cards);
  const dueWords = getDueCards(wordCards as FlashCard[]);
  const dueSentences = getDueCards(sentenceCards as FlashCard[]);

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Mode cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ModeCard
          href="/study/words"
          icon={<BookOpen className="h-8 w-8" />}
          title="Words"
          description="Practice vocabulary with multiple choice"
          color="indigo"
          dueCount={dueWords.length}
          totalCount={wordCards.length}
        />
        <ModeCard
          href="/study/sentences"
          icon={<MessageSquare className="h-8 w-8" />}
          title="Sentences"
          description="Arrange words to form correct sentences"
          color="emerald"
          dueCount={dueSentences.length}
          totalCount={sentenceCards.length}
        />
        <ModeCard
          href="/study/all"
          icon={<Shuffle className="h-8 w-8" />}
          title="All Cards"
          description="Mix words and sentences together"
          color="purple"
          dueCount={dueAll.length}
          totalCount={cards.length}
        />
      </div>
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  description,
  color,
  dueCount,
  totalCount,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  dueCount: number;
  totalCount: number;
}) {
  const colorMap: Record<string, string> = {
    indigo:
      'text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30',
    emerald:
      'text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30',
    purple:
      'text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
  };

  const badgeColorMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };

  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        className={`mb-3 inline-flex rounded-lg p-2 transition-colors ${colorMap[color]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColorMap[color]}`}>
          {dueCount} due
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          of {totalCount} total
        </span>
      </div>
    </Link>
  );
}
