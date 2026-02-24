'use client';

import { useState } from 'react';
import { ArrowLeft, BookOpen, MessageSquare, RotateCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useCards } from '@/context/CardContext';
import { getTypeStats } from '@/lib/studyQueue';

const PRESET_OPTIONS = [5, 10, 20];

export default function SettingsPage() {
  const { cards, settings, updateSettings, resetProgress } = useCards();

  const wordStats = getTypeStats(cards, 'word');
  const sentenceStats = getTypeStats(cards, 'sentence');

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Configure session sizes and manage progress
        </p>
      </div>

      <TypeSettingsPanel
        type="word"
        label="Words"
        icon={<BookOpen className="h-5 w-5" />}
        color="indigo"
        cardsPerSession={settings.words.cardsPerSession}
        stats={wordStats}
        onCardsPerSessionChange={(n) =>
          updateSettings({ words: { cardsPerSession: n } })
        }
        onReset={() => resetProgress('word')}
      />

      <TypeSettingsPanel
        type="sentence"
        label="Sentences"
        icon={<MessageSquare className="h-5 w-5" />}
        color="emerald"
        cardsPerSession={settings.sentences.cardsPerSession}
        stats={sentenceStats}
        onCardsPerSessionChange={(n) =>
          updateSettings({ sentences: { cardsPerSession: n } })
        }
        onReset={() => resetProgress('sentence')}
      />
    </div>
  );
}

function TypeSettingsPanel({
  type,
  label,
  icon,
  color,
  cardsPerSession,
  stats,
  onCardsPerSessionChange,
  onReset,
}: {
  type: 'word' | 'sentence';
  label: string;
  icon: React.ReactNode;
  color: string;
  cardsPerSession: number;
  stats: { total: number; unseen: number; mastered: number; dueForReview: number };
  onCardsPerSessionChange: (n: number) => void;
  onReset: () => void;
}) {
  const [customValue, setCustomValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const maxAvailable = stats.unseen + stats.dueForReview;
  const isCustomActive = !PRESET_OPTIONS.includes(cardsPerSession);

  const handlePresetClick = (n: number) => {
    setCustomValue('');
    onCardsPerSessionChange(n);
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onCardsPerSessionChange(parsed);
    }
  };

  const colorClasses: Record<string, { badge: string; border: string; button: string; activeBtn: string }> = {
    indigo: {
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800/50',
      button: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
      activeBtn: 'bg-indigo-600 text-white dark:bg-indigo-500',
    },
    emerald: {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      button: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600',
      activeBtn: 'bg-emerald-600 text-white dark:bg-emerald-500',
    },
  };

  const colors = colorClasses[color] ?? colorClasses.indigo;

  return (
    <div className={`rounded-2xl border bg-white p-6 dark:bg-gray-800 ${colors.border}`}>
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <span className={`inline-flex rounded-lg p-1.5 ${colors.badge}`}>
          {icon}
        </span>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{label}</h2>
      </div>

      {/* Cards per session */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Cards per session
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => handlePresetClick(n)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                cardsPerSession === n && !isCustomActive
                  ? colors.activeBtn
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <input
              type="number"
              min={1}
              max={stats.total}
              placeholder="Custom"
              value={isCustomActive ? cardsPerSession : customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              className={`w-20 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isCustomActive
                  ? `${colors.border} ring-2 ring-offset-1 ${color === 'indigo' ? 'ring-indigo-400' : 'ring-emerald-400'}`
                  : 'border-gray-200 dark:border-gray-600'
              } bg-white text-gray-900 dark:bg-gray-700 dark:text-white`}
            />
          </div>
        </div>
        {cardsPerSession > maxAvailable && maxAvailable > 0 && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            Only {maxAvailable} {type === 'word' ? 'unseen words' : 'unseen sentences'} available
          </p>
        )}
        {maxAvailable === 0 && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            All {label.toLowerCase()} have been seen or mastered
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700/50">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.unseen}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Unseen of {stats.total}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700/50">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.mastered}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Mastered</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700/50">
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {stats.dueForReview}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Due Review</p>
        </div>
      </div>

      {/* Reset button */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <RotateCcw className="h-4 w-4" />
          Reset {label} Progress
        </button>
      ) : (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              Reset {label} Progress?
            </span>
          </div>
          <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
            All {stats.mastered} mastered {label.toLowerCase()} will reappear.
            This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onReset();
                setShowConfirm(false);
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Yes, Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
