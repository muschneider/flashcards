'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Eraser, Info, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { wordPairs, type WordPair } from '@/data/matchingPairs';
import { shuffle } from '@/lib/studyUtils';
import { clearUsedIds, loadUsedIds, saveUsedIds } from '@/lib/matchPairsStorage';

const PAIRS_PER_ROUND = 5;
const TOTAL_PAIRS = wordPairs.length;

// Single-digit keyboard shortcuts mirroring the number badges, just like the
// reference layout (left column 1-5, right column 6-9 then 0).
const LEFT_KEYS = ['1', '2', '3', '4', '5'];
const RIGHT_KEYS = ['6', '7', '8', '9', '0'];

type Side = 'left' | 'right';
type Selection = { side: Side; id: string } | null;
type WrongPair = { leftId: string; rightId: string } | null;

type Board = {
  left: WordPair[]; // Portuguese meanings column
  right: WordPair[]; // English words column
};

/**
 * Pick up to `count` words that are unambiguous together: no two share the same
 * English word or the same Portuguese meaning (vocab.json has a few repeated
 * meanings, e.g. "entendi"). May return fewer than `count` if the source is
 * small — a single word is always safe, so progress never stalls.
 */
function pickDistinctRound(source: WordPair[], count: number): WordPair[] {
  const round: WordPair[] = [];
  const seenEn = new Set<string>();
  const seenPt = new Set<string>();
  for (const p of shuffle(source)) {
    const en = p.english.trim().toLowerCase();
    const pt = p.portuguese.trim().toLowerCase();
    if (seenEn.has(en) || seenPt.has(pt)) continue;
    round.push(p);
    seenEn.add(en);
    seenPt.add(pt);
    if (round.length === count) break;
  }
  return round;
}

/**
 * Pick the next round from the words that have NOT been used yet. The final
 * round of a cycle may be smaller than a full round so every word gets seen.
 * Only once the whole pool is exhausted does the cycle restart (`cycled`).
 */
function drawRound(currentUsed: string[]): {
  round: WordPair[];
  baseUsed: string[];
  cycled: boolean;
} {
  const usedSet = new Set(currentUsed);
  const unused = wordPairs.filter((p) => !usedSet.has(p.id));

  if (unused.length === 0) {
    return { round: pickDistinctRound(wordPairs, PAIRS_PER_ROUND), baseUsed: [], cycled: true };
  }
  const round = pickDistinctRound(unused, Math.min(PAIRS_PER_ROUND, unused.length));
  return { round, baseUsed: currentUsed, cycled: false };
}

/** Lay out the chosen words into two independently shuffled columns. */
function toBoard(round: WordPair[]): Board {
  return { left: shuffle(round), right: shuffle(round) };
}

export default function MatchPairsGame() {
  const [mounted, setMounted] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const [board, setBoard] = useState<Board | null>(null);

  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Selection>(null);
  const [wrong, setWrong] = useState<WrongPair>(null);
  const [locked, setLocked] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const [cycleJustCompleted, setCycleJustCompleted] = useState(false);
  const [memoryJustReset, setMemoryJustReset] = useState(false);

  // Initialize from localStorage on the client only (avoids hydration mismatch
  // from random board generation during SSR).
  useEffect(() => {
    const stored = loadUsedIds();
    const { round, baseUsed, cycled } = drawRound(stored);
    if (cycled && stored.length > 0) saveUsedIds([]); // normalize stale memory
    setUsed(baseUsed);
    setBoard(toBoard(round));
    setMounted(true);
  }, []);

  const resetRoundState = useCallback(() => {
    setMatched(new Set());
    setSelected(null);
    setWrong(null);
    setLocked(false);
    setMistakes(0);
  }, []);

  const total = board?.left.length ?? 0;
  const matchedCount = matched.size;
  const finished = mounted && total > 0 && matchedCount === total;
  const allPracticed = used.length >= TOTAL_PAIRS;

  const handlePick = useCallback(
    (side: Side, id: string) => {
      if (!board || locked || matched.has(id)) return;
      if (memoryJustReset) setMemoryJustReset(false);
      if (cycleJustCompleted) setCycleJustCompleted(false);

      // Nothing chosen yet → start a selection.
      if (!selected) {
        setSelected({ side, id });
        return;
      }

      // Clicking the same column → switch target (or toggle off).
      if (selected.side === side) {
        setSelected(selected.id === id ? null : { side, id });
        return;
      }

      // Opposite column → evaluate the pair.
      if (selected.id === id) {
        const completesRound = matched.size + 1 === board.left.length;
        setMatched((prev) => new Set(prev).add(id));
        setSelected(null);

        // Bank the round's words as "used" the moment it is completed.
        if (completesRound) {
          const ids = board.left.map((p) => p.id);
          const nextUsed = Array.from(new Set([...used, ...ids]));
          setUsed(nextUsed);
          saveUsedIds(nextUsed);
        }
        return;
      }

      // Wrong match → shake both cards briefly, then clear.
      const leftId = side === 'left' ? id : selected.id;
      const rightId = side === 'right' ? id : selected.id;
      setWrong({ leftId, rightId });
      setMistakes((m) => m + 1);
      setLocked(true);
      window.setTimeout(() => {
        setWrong(null);
        setSelected(null);
        setLocked(false);
      }, 650);
    },
    [board, locked, matched, selected, used, memoryJustReset, cycleJustCompleted],
  );

  // Keyboard shortcuts driven by the number badges.
  useEffect(() => {
    if (!board || finished) return;
    const onKey = (e: KeyboardEvent) => {
      const li = LEFT_KEYS.indexOf(e.key);
      if (li !== -1 && board.left[li]) {
        handlePick('left', board.left[li].id);
        return;
      }
      const ri = RIGHT_KEYS.indexOf(e.key);
      if (ri !== -1 && board.right[ri]) {
        handlePick('right', board.right[ri].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [board, handlePick, finished]);

  // Advance to the next round of still-unused words (auto-resets the cycle when
  // the pool is exhausted).
  const nextRound = useCallback(() => {
    const { round, baseUsed, cycled } = drawRound(used);
    setUsed(baseUsed);
    saveUsedIds(baseUsed);
    setBoard(toBoard(round));
    resetRoundState();
    setMemoryJustReset(false);
    setCycleJustCompleted(cycled);
  }, [used, resetRoundState]);

  // Replay the current 5 words (no new words consumed).
  const restartRound = useCallback(() => {
    if (!board) return;
    setBoard(toBoard(board.left));
    resetRoundState();
  }, [board, resetRoundState]);

  // Forget every used word so the whole pool can reappear immediately.
  const resetMemory = useCallback(() => {
    clearUsedIds();
    const { round } = drawRound([]);
    setUsed([]);
    setBoard(toBoard(round));
    resetRoundState();
    setCycleJustCompleted(false);
    setMemoryJustReset(true);
  }, [resetRoundState]);

  // ─── Loading skeleton (first client paint) ───────────────
  if (!mounted || !board) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="mb-5 h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-3">
                {Array.from({ length: PAIRS_PER_ROUND }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/60"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Completion screen ───────────────────────────────────
  if (finished) {
    const perfect = mistakes === 0;
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <Trophy className="mb-3 h-14 w-14 text-amber-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {allPracticed ? 'Ciclo concluído!' : 'Pares combinados!'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {allPracticed
            ? 'Você já praticou todas as palavras deste módulo. Comece um novo ciclo para revê-las.'
            : perfect
              ? 'Perfeito! Você acertou todos sem nenhum erro.'
              : `Você concluiu com ${mistakes} ${mistakes === 1 ? 'erro' : 'erros'}.`}
        </p>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Praticadas neste ciclo: {Math.min(used.length, TOTAL_PAIRS)} / {TOTAL_PAIRS}
        </p>

        <div className="mt-6 w-full space-y-2 text-left">
          {board.left.map((pair) => (
            <div
              key={pair.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-2.5 dark:bg-gray-700/40"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {pair.english}{' '}
                <span className="font-mono text-xs font-normal text-indigo-600 dark:text-indigo-400">
                  {pair.pronuncia}
                </span>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{pair.portuguese}</span>
            </div>
          ))}
        </div>

        <button
          onClick={nextRound}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {allPracticed ? <RotateCcw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {allPracticed ? 'Recomeçar do início' : 'Próxima rodada'}
        </button>

        {!allPracticed && (
          <button
            onClick={resetMemory}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Eraser className="h-4 w-4" />
            Zerar memória e recomeçar do início
          </button>
        )}
      </div>
    );
  }

  // ─── Board ───────────────────────────────────────────────
  const renderColumn = (side: Side, items: WordPair[], keys: string[]) => (
    <div className="space-y-3">
      {items.map((pair, index) => {
        const isMatched = matched.has(pair.id);
        const isSelected = selected?.side === side && selected.id === pair.id;
        const isWrong = wrong
          ? side === 'left'
            ? wrong.leftId === pair.id
            : wrong.rightId === pair.id
          : false;

        let cls =
          'cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-500/60 dark:hover:bg-gray-700/60';
        let badgeCls = 'border-gray-200 text-gray-400 dark:border-gray-600 dark:text-gray-500';

        if (isMatched) {
          cls =
            'cursor-default border-green-500 bg-green-50 text-green-700 dark:border-green-600/60 dark:bg-green-900/25 dark:text-green-300';
          badgeCls =
            'border-green-300 bg-green-100 text-green-600 dark:border-green-700/60 dark:bg-green-900/40 dark:text-green-300';
        } else if (isWrong) {
          cls =
            'animate-shake cursor-pointer border-red-500 bg-red-50 text-red-700 dark:border-red-600/60 dark:bg-red-900/25 dark:text-red-300';
          badgeCls = 'border-red-300 text-red-500 dark:border-red-700/60 dark:text-red-300';
        } else if (isSelected) {
          cls =
            'cursor-pointer border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-900/60';
          badgeCls = 'border-indigo-300 text-indigo-500 dark:border-indigo-500 dark:text-indigo-300';
        }

        return (
          <button
            key={pair.id}
            type="button"
            onClick={() => handlePick(side, pair.id)}
            disabled={isMatched || locked}
            aria-pressed={isSelected}
            className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 transition-all duration-200 sm:px-4 ${cls}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${badgeCls}`}
            >
              {isMatched ? <Check className="h-3.5 w-3.5" /> : keys[index]}
            </span>
            <span className="flex-1 text-center text-sm font-semibold leading-snug break-words hyphens-auto">
              {side === 'left' ? pair.portuguese : pair.english}
            </span>
            {/* Spacer to keep the word visually centered against the badge. */}
            <span className="h-6 w-6 shrink-0" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {/* Round progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{matchedCount}</span> de{' '}
            {total} pares
          </span>
          <span>
            Erros: <span className="font-bold text-gray-700 dark:text-gray-300">{mistakes}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${total === 0 ? 0 : (matchedCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Transient banners */}
      {cycleJustCompleted && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-300">
          <Sparkles className="h-4 w-4 shrink-0" />
          Você praticou todas as palavras! Recomeçando o ciclo do zero.
        </div>
      )}
      {memoryJustReset && (
        <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-900/20 dark:text-indigo-300">
          <Eraser className="h-4 w-4 shrink-0" />
          Memória zerada — todas as palavras podem reaparecer.
        </div>
      )}

      {/* Card with the two columns */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">Combine os pares:</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {renderColumn('left', board.left, LEFT_KEYS)}
          {renderColumn('right', board.right, RIGHT_KEYS)}
        </div>
      </div>

      {/* Cycle progress + controls */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-300">
            Praticadas neste ciclo:{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {Math.min(used.length, TOTAL_PAIRS)}
            </span>{' '}
            / {TOTAL_PAIRS}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={restartRound}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar rodada
            </button>
            <button
              onClick={resetMemory}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
            >
              <Eraser className="h-3.5 w-3.5" />
              Zerar memória
            </button>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${(Math.min(used.length, TOTAL_PAIRS) / TOTAL_PAIRS) * 100}%` }}
          />
        </div>
        <p className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          As palavras já praticadas não se repetem até você ver todas. Ao terminar, o ciclo recomeça
          sozinho — ou use &quot;Zerar memória&quot; para reaparecerem agora. Toque em uma palavra e
          no seu par, ou use as teclas numéricas.
        </p>
      </div>
    </div>
  );
}
