'use client';

import { useState, useCallback, useMemo } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import { WordCard as WordCardType, WordOption } from '@/lib/types';

type Props = {
  card: WordCardType;
  options: WordOption[];
  onCorrect: () => void;
  onWrong: () => void;
};

const FeedbackMessage = ({ feedback, english, pronunciacion }: { feedback: 'correct' | 'wrong'; english: string; pronunciacion: string }) => (
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
        <X className="h-5 w-5" /> Wrong! The answer is &quot;{english}&quot; ({pronunciacion})
      </>
    )}
  </div>
);

const OptionButton = ({
  option,
  isCorrect,
  isWrong,
  disabled,
  onClick,
}: {
  option: WordOption;
  isCorrect: boolean;
  isWrong: boolean;
  disabled: boolean;
  onClick: () => void;
}) => {
  const className = useMemo(() => {
    const base = 'rounded-xl border-2 px-4 py-3 text-center font-semibold transition-all duration-200';

    if (disabled) {
      if (isCorrect) {
        return `${base} border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300`;
      }
      if (isWrong) {
        return `${base} border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-shake`;
      }
      return `${base} border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500`;
    }

    return `${base} border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30 cursor-pointer`;
  }, [disabled, isCorrect, isWrong]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={`Select ${option.word}`}
    >
      <span className="block text-base">{option.word}</span>
      <span className="block text-xs opacity-70">{option.pronunciacion}</span>
    </button>
  );
};

export default function WordCard({ card, options, onCorrect, onWrong }: Props) {
  const [selected, setSelected] = useState<WordOption | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showExample, setShowExample] = useState(false);

  const handleSelect = useCallback(
    (option: WordOption) => {
      if (feedback) return;
      setSelected(option);

      if (option.word === card.english) {
        setFeedback('correct');
        setTimeout(() => onCorrect(), 1200);
      } else {
        setFeedback('wrong');
        setTimeout(() => onWrong(), 2000);
      }
    },
    [card.english, feedback, onCorrect, onWrong]
  );

  const toggleExample = useCallback(() => {
    setShowExample((prev) => !prev);
  }, []);

  const isCorrectAnswer = useCallback(
    (option: WordOption) => option.word === card.english,
    [card.english]
  );

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {card.tipo}
          </span>
          <button
            onClick={toggleExample}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            aria-label="Show example"
          >
            <Lightbulb className="h-4 w-4" />
            {showExample ? 'Hide' : 'Example'}
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            What is the English word for:
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{card.portuguese}</h2>
        </div>

        {showExample && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <span className="font-medium">Example:</span> {card.example}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <OptionButton
              key={option.word}
              option={option}
              isCorrect={isCorrectAnswer(option)}
              isWrong={selected?.word === option.word && feedback === 'wrong'}
              disabled={!!feedback}
              onClick={() => handleSelect(option)}
            />
          ))}
        </div>

        {feedback && (
          <FeedbackMessage feedback={feedback} english={card.english} pronunciacion={card.pronunciacion} />
        )}
      </div>
    </div>
  );
}
