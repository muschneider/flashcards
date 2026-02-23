'use client';

import { useState, useCallback } from 'react';
import { Check, X, Lightbulb, Loader2 } from 'lucide-react';
import { WordCard as WordCardType } from '@/lib/types';

type Props = {
  card: WordCardType;
  options: string[];
  onCorrect: () => void;
  onWrong: () => void;
};

export default function WordCard({ card, options, onCorrect, onWrong }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [geminiHint, setGeminiHint] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const handleSelect = useCallback(
    (option: string) => {
      if (feedback) return; // already answered
      setSelected(option);

      if (option === card.english) {
        setFeedback('correct');
        setTimeout(() => onCorrect(), 1200);
      } else {
        setFeedback('wrong');
        setTimeout(() => onWrong(), 2000);
      }
    },
    [card.english, feedback, onCorrect, onWrong]
  );

  const fetchGeminiExample = useCallback(async () => {
    setGeminiLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'word_example',
          word: card.english,
          portuguese: card.portuguese,
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setGeminiHint(data.result);
    } catch {
      setGeminiHint('Could not load examples. Check your API key configuration.');
    } finally {
      setGeminiLoading(false);
    }
  }, [card.english, card.portuguese]);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800">
        {/* Card type badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Word Card
          </span>
          <button
            onClick={fetchGeminiExample}
            disabled={geminiLoading || !!geminiHint}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            aria-label="Get example sentences"
          >
            {geminiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            Example
          </button>
        </div>

        {/* Portuguese word */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            What is the English word for:
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {card.portuguese}
          </h2>
        </div>

        {/* Gemini hint */}
        {geminiHint && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {geminiHint}
          </div>
        )}

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => {
            let btnClass =
              'rounded-xl border-2 px-4 py-3 text-center font-semibold transition-all duration-200';

            if (feedback) {
              if (option === card.english) {
                btnClass +=
                  ' border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
              } else if (option === selected && feedback === 'wrong') {
                btnClass +=
                  ' border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-shake';
              } else {
                btnClass +=
                  ' border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500';
              }
            } else {
              btnClass +=
                ' border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30 cursor-pointer';
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={!!feedback}
                className={btnClass}
                aria-label={`Select ${option}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mt-4 flex items-center justify-center gap-2 rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
              feedback === 'correct'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {feedback === 'correct' ? (
              <>
                <Check className="h-5 w-5" /> Correct!
              </>
            ) : (
              <>
                <X className="h-5 w-5" /> Wrong! The answer is &quot;{card.english}&quot;
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
