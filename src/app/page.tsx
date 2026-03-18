'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  Trophy,
  Clock,
  Layers,
  AlertCircle,
  Info,
  EyeOff,
} from 'lucide-react';
import { useCards } from '@/context/CardContext';

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'indigo' | 'green' | 'amber' | 'purple';
}) {
  const bgClass = useMemo(() => {
    const map = {
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
      green: 'bg-green-50 dark:bg-green-900/20',
      amber: 'bg-amber-50 dark:bg-amber-900/20',
      purple: 'bg-purple-50 dark:bg-purple-900/20',
    };
    return map[color];
  }, [color]);

  return (
    <div className={`rounded-xl border border-gray-200 p-4 dark:border-gray-700 ${bgClass}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
});

const ActionCard = memo(function ActionCard({
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
  color: 'indigo' | 'emerald' | 'purple';
}) {
  const colorClass = useMemo(() => {
    const map = {
      indigo: 'text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30',
      emerald: 'text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30',
      purple: 'text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
    };
    return map[color];
  }, [color]);

  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className={`mb-3 inline-flex rounded-lg p-2 transition-colors ${colorClass}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </Link>
  );
});

const TypeStatsBadge = memo(function TypeStatsBadge({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  valueColor: 'default' | 'green' | 'amber';
}) {
  const colorClass = useMemo(() => {
    const map = {
      default: 'text-gray-700 dark:text-gray-300',
      green: 'text-green-600 dark:text-green-400',
      amber: 'text-amber-600 dark:text-amber-400',
    };
    return map[valueColor];
  }, [valueColor]);

  return (
    <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
      {icon}
      {label}: <span className={`font-medium ${colorClass}`}>{value}</span>
    </span>
  );
});

export default function Dashboard() {
  const { settings, stats, getWordStats, getSentenceStats } = useCards();

  const wordStats = useMemo(() => getWordStats(), [getWordStats]);
  const sentenceStats = useMemo(() => getSentenceStats(), [getSentenceStats]);

  const progressPercent = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.mastered / stats.total) * 100);
  }, [stats.total, stats.mastered]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          English FlashCards
        </h1>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Learn English words and sentences with spaced repetition
        </p>
      </div>

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

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Study Sessions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-200 bg-white p-6 dark:border-indigo-800/50 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Words</h3>
            </div>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              Session size: <span className="font-medium text-gray-700 dark:text-gray-300">{settings.words.cardsPerSession} cards</span>
            </p>
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <TypeStatsBadge icon={<EyeOff className="h-3.5 w-3.5" />} label="Unseen" value={wordStats.unseen} valueColor="default" />
              <TypeStatsBadge icon={<Trophy className="h-3.5 w-3.5" />} label="Mastered" value={wordStats.mastered} valueColor="green" />
              <TypeStatsBadge icon={<Clock className="h-3.5 w-3.5" />} label="Review" value={wordStats.dueForReview} valueColor="amber" />
            </div>
            <Link
              href="/study/words"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <BookOpen className="h-4 w-4" />
              Start Word Session
            </Link>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800/50 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Sentences</h3>
            </div>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              Session size: <span className="font-medium text-gray-700 dark:text-gray-300">{settings.sentences.cardsPerSession} cards</span>
            </p>
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <TypeStatsBadge icon={<EyeOff className="h-3.5 w-3.5" />} label="Unseen" value={sentenceStats.unseen} valueColor="default" />
              <TypeStatsBadge icon={<Trophy className="h-3.5 w-3.5" />} label="Mastered" value={sentenceStats.mastered} valueColor="green" />
              <TypeStatsBadge icon={<Clock className="h-3.5 w-3.5" />} label="Review" value={sentenceStats.dueForReview} valueColor="amber" />
            </div>
            <Link
              href="/study/sentences"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <MessageSquare className="h-4 w-4" />
              Start Sentence Session
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">More Options</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ActionCard
            href="/study"
            icon={<Layers className="h-8 w-8" />}
            title="All Modes"
            description="Choose your study mode or mix everything"
            color="purple"
          />
          <ActionCard
            href="/manage"
            icon={<Settings className="h-8 w-8" />}
            title="Manage Cards"
            description="Add, view, or delete word and sentence cards"
            color="emerald"
          />
          <ActionCard
            href="/settings"
            icon={<SlidersHorizontal className="h-8 w-8" />}
            title="Settings"
            description="Configure session sizes and reset progress"
            color="indigo"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your progress is saved on this device only. Use a different browser or device to start fresh.
        </p>
      </div>
    </div>
  );
}
