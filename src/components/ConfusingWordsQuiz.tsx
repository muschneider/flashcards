'use client';

import { useState } from 'react';
import { Check, X, Ear, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { ConfusingWord } from '@/data/confusingWords';
import { shuffle } from '@/lib/studyUtils';
import PronounceButton from '@/components/PronounceButton';

type QuestionKind = 'meaning' | 'blank' | 'listen';

type Question = {
  id: string;
  kind: QuestionKind;
  word: ConfusingWord;
  /** The blanked sentence for "blank"; the word itself otherwise. */
  prompt: string;
  /** Portuguese hint shown for the "blank" questions. */
  promptPt?: string;
  options: string[];
  answer: string;
};

const QUIZ_SIZE = 8;

function blankOut(sentence: string, word: string): string {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return sentence.replace(re, '_____');
}

/** Pick `count` options that always include `correct`, drawn from `pool`. */
function pickOptions(correct: string, pool: string[], count = 4): string[] {
  const distractors = shuffle(pool.filter((p) => p !== correct)).slice(0, count - 1);
  return shuffle([correct, ...distractors]);
}

function buildQuiz(words: ConfusingWord[]): Question[] {
  const wordLabels = words.map((w) => w.word);
  const meaningLabels = words.map((w) => w.portuguese);

  const candidates: Question[] = [];

  for (const w of words) {
    candidates.push({
      id: `${w.id}-meaning`,
      kind: 'meaning',
      word: w,
      prompt: w.word,
      options: pickOptions(w.portuguese, meaningLabels),
      answer: w.portuguese,
    });

    candidates.push({
      id: `${w.id}-blank`,
      kind: 'blank',
      word: w,
      prompt: blankOut(w.examples[0].en, w.word),
      promptPt: w.examples[0].pt,
      options: pickOptions(w.word, wordLabels),
      answer: w.word,
    });

    candidates.push({
      id: `${w.id}-listen`,
      kind: 'listen',
      word: w,
      prompt: w.word,
      options: pickOptions(w.word, wordLabels),
      answer: w.word,
    });
  }

  return shuffle(candidates).slice(0, Math.min(QUIZ_SIZE, candidates.length));
}

const KIND_LABEL: Record<QuestionKind, string> = {
  meaning: 'O que esta palavra significa?',
  blank: 'Complete a frase',
  listen: 'Ouça e escolha a palavra',
};

type Props = {
  words: ConfusingWord[];
};

export default function ConfusingWordsQuiz({ words }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuiz(words));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const answered = selected !== null;
  const isCorrect = answered && selected === question.answer;

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    if (option === question.answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
  };

  const handleRestart = () => {
    setQuestions(buildQuiz(words));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  // ─── Results screen ──────────────────────────────────────
  if (finished) {
    const total = questions.length;
    const percent = Math.round((score / total) * 100);
    const message =
      percent === 100
        ? 'Perfeito! Você dominou essas palavras.'
        : percent >= 70
          ? 'Muito bom! Já está quase lá.'
          : 'Continue praticando — revise o modo Aprender e tente de novo.';

    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <Trophy className="mb-3 h-14 w-14 text-amber-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz concluído!</h2>
        <p className="mt-4 text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
          {score} / {total}
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{percent}% de acerto</p>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
        <button
          onClick={handleRestart}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  // ─── Question screen ─────────────────────────────────────
  const optionsAreWords = question.kind !== 'meaning';

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>
            Pergunta {current + 1} de {questions.length}
          </span>
          <span>
            Acertos: <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          {KIND_LABEL[question.kind]}
        </p>

        {/* Prompt */}
        <div className="mb-6 text-center">
          {question.kind === 'meaning' && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{question.prompt}</span>
              <PronounceButton text={question.word.word} audioUrl={question.word.audioUrl} size="md" />
            </div>
          )}

          {question.kind === 'listen' && (
            <div className="flex flex-col items-center gap-2">
              <PronounceButton text={question.word.word} audioUrl={question.word.audioUrl} size="lg" label="Ouvir a palavra" />
              <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <Ear className="h-3.5 w-3.5" />
                Toque para ouvir novamente
              </span>
            </div>
          )}

          {question.kind === 'blank' && (
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{question.prompt}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{question.promptPt}</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className={optionsAreWords ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
          {question.options.map((option) => {
            const base =
              'rounded-xl border-2 px-4 py-3 text-center font-semibold transition-all duration-200';
            const isAnswer = option === question.answer;
            const isPicked = option === selected;

            let cls: string;
            if (!answered) {
              cls = `${base} cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30`;
            } else if (isAnswer) {
              cls = `${base} border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300`;
            } else if (isPicked) {
              cls = `${base} animate-shake border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
            } else {
              cls = `${base} border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500`;
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={answered}
                className={cls}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answered && (
          <div className="mt-5">
            <div
              className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm font-medium ${
                isCorrect
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {isCorrect ? (
                <>
                  <Check className="h-5 w-5" /> Correto!
                </>
              ) : (
                <>
                  <X className="h-5 w-5" /> A resposta é &quot;{question.answer}&quot;
                </>
              )}
            </div>

            {/* Reinforcement: the word, its sound and meaning */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/40">
              <div className="text-left">
                <p className="font-bold text-gray-900 dark:text-white">
                  {question.word.word}{' '}
                  <span className="font-mono text-sm font-normal text-indigo-600 dark:text-indigo-400">
                    {question.word.respelling}
                  </span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{question.word.portuguese}</p>
              </div>
              <PronounceButton text={question.word.word} audioUrl={question.word.audioUrl} size="md" />
            </div>

            <button
              onClick={handleNext}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {current + 1 >= questions.length ? 'Ver resultado' : 'Próxima'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
