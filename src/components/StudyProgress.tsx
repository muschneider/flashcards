'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  completed: number;
  sessionTotal: number;
  itemLabel?: string;
  color?: 'indigo' | 'emerald' | 'purple';
};

export default function StudyProgress({
  completed,
  sessionTotal,
  itemLabel = 'Card',
  color = 'indigo',
}: Props) {
  const gradientMap = {
    indigo: 'from-indigo-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-pink-500',
  };

  const gradient = gradientMap[color];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {itemLabel} {Math.min(completed + 1, sessionTotal)} of {sessionTotal}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{
            width: `${sessionTotal > 0 ? (completed / sessionTotal) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}
