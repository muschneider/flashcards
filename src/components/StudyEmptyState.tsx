'use client';

import Link from 'next/link';
import { ArrowLeft, PartyPopper, RotateCcw } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  resetLabel?: string;
  onReset?: () => void;
  color?: 'indigo' | 'emerald' | 'purple';
};

export default function StudyEmptyState({
  title,
  description,
  resetLabel,
  onReset,
  color = 'purple',
}: Props) {
  const colorClasses = {
    indigo: {
      button: 'bg-indigo-600 hover:bg-indigo-700',
      border: 'border-indigo-200 dark:border-indigo-800/50',
    },
    emerald: {
      button: 'bg-emerald-600 hover:bg-emerald-700',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    purple: {
      button: 'bg-purple-600 hover:bg-purple-700',
      border: 'border-purple-200 dark:border-purple-800/50',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <PartyPopper className="mb-4 h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {resetLabel && onReset && (
          <button
            onClick={onReset}
            className={`inline-flex items-center gap-2 rounded-xl border-2 ${colors.border} bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`}
          >
            <RotateCcw className="h-4 w-4" />
            {resetLabel}
          </button>
        )}
        <Link
          href="/"
          className={`inline-flex items-center gap-2 rounded-xl ${colors.button} px-6 py-3 font-semibold text-white transition-colors`}
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
