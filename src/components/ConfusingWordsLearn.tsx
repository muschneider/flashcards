'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Music2 } from 'lucide-react';
import { ConfusingWord } from '@/data/confusingWords';
import PronounceButton from '@/components/PronounceButton';

type Props = {
  words: ConfusingWord[];
};

export default function ConfusingWordsLearn({ words }: Props) {
  const [index, setIndex] = useState(0);
  const total = words.length;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  // Arrow-key navigation between cards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  const word = words[index];
  if (!word) return null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {words.map((w, i) => (
          <button
            key={w.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to ${w.word}`}
            className={`h-2.5 rounded-full transition-all ${
              i === index
                ? 'w-8 bg-indigo-600 dark:bg-indigo-400'
                : 'w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {word.pos}
          </span>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {index + 1} / {total}
          </span>
        </div>

        {/* Word + audio */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              {word.word}
            </h2>
            <PronounceButton text={word.word} audioUrl={word.audioUrl} size="lg" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="font-mono text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              {word.respelling}
            </span>
            <span className="font-mono text-sm text-gray-400 dark:text-gray-500">{word.ipa}</span>
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Music2 className="h-3.5 w-3.5" />
            rima com: {word.rhymesWith}
          </p>
        </div>

        {/* Translation */}
        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-700/40">
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Tradução</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{word.portuguese}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{word.meaning}</p>
        </div>

        {/* Memory tip */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Dica: </span>
            {word.tip}
          </p>
        </div>

        {/* Examples */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Exemplos de uso
          </h3>
          <ul className="space-y-3">
            {word.examples.map((ex) => (
              <li
                key={ex.en}
                className="rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900 dark:text-white">{ex.en}</p>
                  <PronounceButton text={ex.en} size="sm" />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{ex.pt}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <button
          onClick={goNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
