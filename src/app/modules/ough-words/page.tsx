'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Dumbbell } from 'lucide-react';
import { oughWords } from '@/data/confusingWords';
import ConfusingWordsLearn from '@/components/ConfusingWordsLearn';
import ConfusingWordsQuiz from '@/components/ConfusingWordsQuiz';

type Mode = 'learn' | 'quiz';

export default function OughWordsModulePage() {
  const [mode, setMode] = useState<Mode>('learn');

  return (
    <div className="space-y-6">
      <Link
        href="/modules"
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Módulos
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Palavras &quot;ough&quot; confusas
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-gray-500 dark:text-gray-400">
          Seis palavras parecidas na escrita, mas com som e significado bem diferentes.
          Aprenda a pronúncia, a tradução e como usar cada uma — com áudio em inglês.
        </p>
      </div>

      {/* Mode switcher */}
      <div className="mx-auto flex w-full max-w-xs rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setMode('learn')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'learn'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Aprender
        </button>
        <button
          onClick={() => setMode('quiz')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'quiz'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          Praticar
        </button>
      </div>

      {mode === 'learn' ? (
        <ConfusingWordsLearn words={oughWords} />
      ) : (
        <ConfusingWordsQuiz words={oughWords} />
      )}
    </div>
  );
}
