'use client';

import Link from 'next/link';
import { ArrowLeft, PartyPopper, Check, AlertCircle } from 'lucide-react';

type Props = {
  title: string;
  completed: number;
  correctOnFirst: number;
  needReview: number;
  itemLabel?: string;
};

export default function StudyCompleteState({
  title,
  completed,
  correctOnFirst,
  needReview,
  itemLabel = 'Cards',
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <PartyPopper className="mb-4 h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="mt-4 space-y-2">
        <p className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
          {itemLabel} studied: <span className="font-bold">{completed}</span>
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
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
