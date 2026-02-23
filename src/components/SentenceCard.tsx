'use client';

import { useState, useCallback } from 'react';
import { Check, X, Eraser, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';
import { SentenceCard as SentenceCardType } from '@/lib/types';
import { shuffle } from '@/lib/studyUtils';

type Props = {
  card: SentenceCardType;
  onCorrect: () => void;
  onWrong: () => void;
};

export default function SentenceCard({ card, onCorrect, onWrong }: Props) {
  const [scrambled] = useState(() => shuffle(card.words));
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableIndices, setAvailableIndices] = useState<Set<number>>(
    () => new Set(scrambled.map((_, i) => i))
  );
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [geminiHint, setGeminiHint] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const handleWordClick = useCallback(
    (index: number) => {
      if (feedback) return;
      setSelectedWords((prev) => [...prev, scrambled[index]]);
      setAvailableIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    },
    [feedback, scrambled]
  );

  const handleClear = useCallback(() => {
    if (feedback) return;
    setSelectedWords([]);
    setAvailableIndices(new Set(scrambled.map((_, i) => i)));
  }, [feedback, scrambled]);

  const handleCheck = useCallback(() => {
    if (feedback) return;
    const userSentence = selectedWords.join(' ');
    const correctSentence = card.english;

    if (userSentence === correctSentence) {
      setFeedback('correct');
      setTimeout(() => onCorrect(), 1200);
    } else {
      setFeedback('wrong');
      setTimeout(() => onWrong(), 2500);
    }
  }, [feedback, selectedWords, card.english, onCorrect, onWrong]);

  const fetchGeminiHint = useCallback(async () => {
    setGeminiLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sentence_hint',
          sentence: card.english,
          portuguese: card.portuguese,
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setGeminiHint(data.result);
    } catch {
      setGeminiHint('Could not load hint. Check your API key configuration.');
    } finally {
      setGeminiLoading(false);
    }
  }, [card.english, card.portuguese]);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800">
        {/* Card type badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Sentence Card
          </span>
          <button
            onClick={fetchGeminiHint}
            disabled={geminiLoading || !!geminiHint}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            aria-label="Get a hint"
          >
            {geminiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            Hint
          </button>
        </div>

        {/* Portuguese sentence */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            Arrange the words to translate:
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {card.portuguese}
          </h2>
        </div>

        {/* Gemini hint */}
        {geminiHint && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {geminiHint}
          </div>
        )}

        {/* Answer area */}
        <div className="mb-4 min-h-[3rem] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50">
          {selectedWords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedWords.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                >
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
              Click words below to build the sentence...
            </p>
          )}
        </div>

        {/* Scrambled word bank */}
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {scrambled.map((word, index) => {
            const isAvailable = availableIndices.has(index);
            return (
              <button
                key={`${word}-${index}`}
                onClick={() => handleWordClick(index)}
                disabled={!isAvailable || !!feedback}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isAvailable
                    ? 'border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30 cursor-pointer'
                    : 'border-transparent bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600'
                }`}
                aria-label={`Select word: ${word}`}
              >
                {word}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        {!feedback && (
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              disabled={selectedWords.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              aria-label="Clear selected words"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={handleCheck}
              disabled={selectedWords.length !== card.words.length}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              aria-label="Check answer"
            >
              <CheckCircle className="h-4 w-4" />
              Check
            </button>
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mt-4 flex flex-col items-center gap-2 rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
              feedback === 'correct'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {feedback === 'correct' ? (
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5" /> Correct!
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <X className="h-5 w-5" /> Not quite right!
                </span>
                <span className="text-xs opacity-80">
                  Correct: &quot;{card.english}&quot;
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
