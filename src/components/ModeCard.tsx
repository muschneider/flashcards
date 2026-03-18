'use client';

import Link from 'next/link';
import { memo, useMemo } from 'react';

type Props = {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'indigo' | 'emerald' | 'purple';
  dueCount: number;
  totalCount: number;
};

const ModeCard = memo(function ModeCard({
  href,
  icon,
  title,
  description,
  color,
  dueCount,
  totalCount,
}: Props) {
  const colorClasses = useMemo(() => {
    const map = {
      indigo: {
        icon: 'text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30',
        badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
      },
      emerald: {
        icon: 'text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      },
      purple: {
        icon: 'text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      },
    };
    return map[color];
  }, [color]);

  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className={`mb-3 inline-flex rounded-lg p-2 transition-colors ${colorClasses.icon}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses.badge}`}>
          {dueCount} due
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">of {totalCount} total</span>
      </div>
    </Link>
  );
});

export default ModeCard;
