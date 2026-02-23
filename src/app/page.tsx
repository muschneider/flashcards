'use client';

import Link from 'next/link';
import {
  BookOpen,
  Settings,
  RotateCcw,
  Trophy,
  Clock,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useCards } from '@/context/CardContext';

export default function Dashboard() {
  const { stats } = useCards();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          English FlashCards
        </h1>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Learn English words and sentences with spaced repetition
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Layers className="h-6 w-6 text-indigo-500" />}
          label="Total Cards"
          value={stats.total}
          color="indigo"
        />
        <StatCard
          icon={<Trophy className="h-6 w-6 text-green-500" />}
          label="Mastered"
          value={stats.mastered}
          color="green"
        />
        <StatCard
          icon={<AlertCircle className="h-6 w-6 text-amber-500" />}
          label="Pending"
          value={stats.pending}
          color="amber"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-purple-500" />}
          label="Due for Review"
          value={stats.dueForReview}
          color="purple"
        />
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {stats.total > 0
              ? Math.round((stats.mastered / stats.total) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{
              width: `${
                stats.total > 0
                  ? (stats.mastered / stats.total) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ActionCard
          href="/study"
          icon={<BookOpen className="h-8 w-8" />}
          title="Study Mode"
          description="Practice your flashcards with spaced repetition"
          color="indigo"
        />
        <ActionCard
          href="/manage"
          icon={<Settings className="h-8 w-8" />}
          title="Manage Cards"
          description="Add, view, or delete word and sentence cards"
          color="emerald"
        />
        <ActionCard
          href="/reset"
          icon={<RotateCcw className="h-8 w-8" />}
          title="Reset Progress"
          description="Clear all progress and start fresh"
          color="red"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 p-4 ${bgMap[color]} dark:border-gray-700`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo:
      'text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30',
    emerald:
      'text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30',
    red: 'text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30',
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
    </Link>
  );
}
