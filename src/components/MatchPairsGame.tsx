'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Eraser, Info, Repeat, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { wordPairs, type WordPair } from '@/data/matchingPairs';
import { shuffle } from '@/lib/studyUtils';
import {
  DEFAULT_CHALLENGES_PER_SESSION,
  loadChallengesPerSession,
  loadUsedIds,
  saveChallengesPerSession,
  saveUsedIds,
} from '@/lib/matchPairsStorage';

const TOTAL_PAIRS = wordPairs.length;

// Each challenge is a board of (up to) this many pairs — like the reference.
const PAIRS_PER_CHALLENGE = 5;

// How many challenges to play in a row (mirrors the "Cards per session" widget).
const SESSION_PRESETS = [5, 10, 20];
const MAX_CHALLENGES = 50;

type Side = 'left' | 'right';
type Selection = { side: Side; id: string } | null;
type WrongPair = { leftId: string; rightId: string } | null;

type Board = {
  left: WordPair[]; // Portuguese meanings column
  right: WordPair[]; // English words column
};

const clampChallenges = (n: number) => Math.max(1, Math.min(Math.round(n), MAX_CHALLENGES));

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
 * Pick the next challenge from the words that have NOT been used yet. The final
 * challenge of a cycle may be smaller so every word gets seen. Only once the
 * whole pool is exhausted does the cycle restart (`cycled`).
 */
function drawChallenge(currentUsed: string[]): {
  round: WordPair[];
  baseUsed: string[];
  cycled: boolean;
} {
  const usedSet = new Set(currentUsed);
  const unused = wordPairs.filter((p) => !usedSet.has(p.id));

  if (unused.length === 0) {
    return { round: pickDistinctRound(wordPairs, PAIRS_PER_CHALLENGE), baseUsed: [], cycled: true };
  }
  const round = pickDistinctRound(unused, Math.min(PAIRS_PER_CHALLENGE, unused.length));
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

  // Session config: how many challenges to play in a row.
  const [challengesTarget, setChallengesTarget] = useState(DEFAULT_CHALLENGES_PER_SESSION);
  const [customValue, setCustomValue] = useState('');

  // Per-board state.
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Selection>(null);
  const [wrong, setWrong] = useState<WrongPair>(null);
  const [locked, setLocked] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Session-level state.
  const [mistakes, setMistakes] = useState(0);
  const [challengesDone, setChallengesDone] = useState(0);
  const [sessionPairs, setSessionPairs] = useState<WordPair[]>([]);
  const [sessionFinished, setSessionFinished] = useState(false);

  const [cycleJustCompleted, setCycleJustCompleted] = useState(false);
  const [memoryJustReset, setMemoryJustReset] = useState(false);

  const resetBoardState = useCallback(() => {
    setMatched(new Set());
    setSelected(null);
    setWrong(null);
    setLocked(false);
    setAdvancing(false);
  }, []);

  // Start a fresh session of challenges from the given memory. Returns whether
  // the word pool cycled (was exhausted) while drawing the first challenge.
  const beginSession = useCallback(
    (currentUsed: string[]): boolean => {
      const { round, baseUsed, cycled } = drawChallenge(currentUsed);
      setUsed(baseUsed);
      saveUsedIds(baseUsed);
      setBoard(toBoard(round));
      setChallengesDone(0);
      setSessionPairs([]);
      setMistakes(0);
      setSessionFinished(false);
      setMatched(new Set());
      setSelected(null);
      setWrong(null);
      setLocked(false);
      setAdvancing(false);
      return cycled;
    },
    [],
  );

  // Initialize from localStorage on the client only (avoids hydration mismatch).
  useEffect(() => {
    const storedUsed = loadUsedIds();
    const storedTarget = clampChallenges(loadChallengesPerSession());
    const { round, baseUsed, cycled } = drawChallenge(storedUsed);
    if (cycled && storedUsed.length > 0) saveUsedIds([]); // normalize stale memory
    setChallengesTarget(storedTarget);
    setUsed(baseUsed);
    setBoard(toBoard(round));
    setMounted(true);
  }, []);

  const total = board?.left.length ?? 0;
  const matchedCount = matched.size;
  const allPracticed = used.length >= TOTAL_PAIRS;
  const isCustomActive = !SESSION_PRESETS.includes(challengesTarget);
  // Single-digit number badges/keys fit up to 5 pairs (10 items: 1-9, 0).
  const keyboardEnabled = total > 0 && total * 2 <= 10;
  const badgeFor = (position: number) =>
    keyboardEnabled && position === 10 ? '0' : String(position);

  const currentChallenge = Math.min(challengesDone + 1, challengesTarget);
  const sessionProgress = Math.min(
    1,
    challengesTarget > 0
      ? (challengesDone + (total > 0 ? matchedCount / total : 0)) / challengesTarget
      : 0,
  );

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
        const completesChallenge = matched.size + 1 === board.left.length;
        setMatched((prev) => new Set(prev).add(id));
        setSelected(null);

        if (completesChallenge) {
          // Bank this challenge's words as "used".
          const ids = board.left.map((p) => p.id);
          const nextUsed = Array.from(new Set([...used, ...ids]));
          setUsed(nextUsed);
          saveUsedIds(nextUsed);
          setSessionPairs((prev) => [...prev, ...board.left]);

          const newDone = challengesDone + 1;
          setChallengesDone(newDone);
          setLocked(true); // freeze during the brief transition

          if (newDone >= challengesTarget) {
            // Whole session done → show the results screen after a short beat.
            window.setTimeout(() => {
              setSessionFinished(true);
              setLocked(false);
            }, 600);
          } else {
            // Auto-advance to the next challenge.
            setAdvancing(true);
            window.setTimeout(() => {
              const { round, baseUsed, cycled } = drawChallenge(nextUsed);
              setUsed(baseUsed);
              saveUsedIds(baseUsed);
              setBoard(toBoard(round));
              setMatched(new Set());
              setSelected(null);
              setWrong(null);
              setLocked(false);
              setAdvancing(false);
              if (cycled) setCycleJustCompleted(true);
            }, 750);
          }
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
    [board, locked, matched, selected, used, challengesDone, challengesTarget, memoryJustReset, cycleJustCompleted],
  );

  // Keyboard shortcuts driven by the number badges.
  useEffect(() => {
    if (!board || sessionFinished) return;
    const n = board.left.length;
    if (n * 2 > 10) return;
    const onKey = (e: KeyboardEvent) => {
      let pos: number | null = null;
      if (e.key === '0') pos = 10;
      else if (/^[1-9]$/.test(e.key)) pos = parseInt(e.key, 10);
      if (pos === null) return;
      if (pos <= n) {
        const target = board.left[pos - 1];
        if (target) handlePick('left', target.id);
      } else if (pos <= n * 2) {
        const target = board.right[pos - n - 1];
        if (target) handlePick('right', target.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [board, handlePick, sessionFinished]);

  // Start a brand new session (continuing the no-repeat memory).
  const newSession = useCallback(() => {
    const cycled = beginSession(used);
    setCycleJustCompleted(cycled);
    setMemoryJustReset(false);
  }, [used, beginSession]);

  // Replay the current challenge's words (no new words consumed).
  const restartChallenge = useCallback(() => {
    if (!board) return;
    setBoard(toBoard(board.left));
    resetBoardState();
  }, [board, resetBoardState]);

  // Forget every used word so the whole pool can reappear, and restart.
  const resetMemory = useCallback(() => {
    beginSession([]);
    setCycleJustCompleted(false);
    setMemoryJustReset(true);
  }, [beginSession]);

  // Change how many challenges to play in a row and restart the session.
  const changeChallenges = useCallback(
    (n: number) => {
      const clamped = clampChallenges(n);
      setChallengesTarget(clamped);
      saveChallengesPerSession(clamped);
      const cycled = beginSession(used);
      setCycleJustCompleted(cycled);
      setMemoryJustReset(false);
    },
    [used, beginSession],
  );

  const handlePresetClick = (n: number) => {
    setCustomValue('');
    changeChallenges(n);
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1) changeChallenges(parsed);
  };

  // ─── Session-size selector ───────────────────────────────
  const sessionSelector = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex rounded-lg bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
          <Repeat className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Desafios</h2>
      </div>

      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Desafios seguidos
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {SESSION_PRESETS.map((n) => (
          <button
            key={n}
            onClick={() => handlePresetClick(n)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              challengesTarget === n && !isCustomActive
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
        <span className="text-sm text-gray-500 dark:text-gray-400">ou</span>
        <input
          type="number"
          min={1}
          max={MAX_CHALLENGES}
          placeholder="Custom"
          value={isCustomActive ? challengesTarget : customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          className={`w-24 rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:bg-gray-700 dark:text-white ${
            isCustomActive
              ? 'border-indigo-300 ring-2 ring-indigo-400 ring-offset-1 dark:border-indigo-500 dark:ring-offset-gray-800'
              : 'border-gray-200 dark:border-gray-600'
          }`}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        Quantos desafios fazer em seguida antes de ver o resultado (até {MAX_CHALLENGES}). Mudar o
        valor recomeça a sessão.
      </p>
    </div>
  );

  // ─── Loading skeleton (first client paint) ───────────────
  if (!mounted || !board) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="mb-5 h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-3">
                {Array.from({ length: PAIRS_PER_CHALLENGE }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/60"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Session results screen ──────────────────────────────
  if (sessionFinished) {
    const perfect = mistakes === 0;
    const recap = Array.from(new Map(sessionPairs.map((p) => [p.id, p])).values());
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <Trophy className="mb-3 h-14 w-14 text-amber-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {allPracticed ? 'Ciclo concluído!' : 'Sessão concluída!'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {perfect
            ? 'Perfeito! Você acertou todos sem nenhum erro.'
            : `Você concluiu com ${mistakes} ${mistakes === 1 ? 'erro' : 'erros'}.`}
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {challengesDone} {challengesDone === 1 ? 'desafio' : 'desafios'} • Praticadas neste ciclo:{' '}
          {Math.min(used.length, TOTAL_PAIRS)} / {TOTAL_PAIRS}
        </p>

        <div className="mt-6 max-h-72 w-full space-y-2 overflow-y-auto text-left">
          {recap.map((pair) => (
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
          onClick={newSession}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {allPracticed ? <RotateCcw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {allPracticed ? 'Recomeçar do início' : 'Nova sessão'}
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
  const renderColumn = (side: Side, items: WordPair[]) => (
    <div className="space-y-3">
      {items.map((pair, index) => {
        const position = side === 'left' ? index + 1 : total + index + 1;
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
            className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-2 transition-all duration-200 sm:px-4 ${cls}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${badgeCls}`}
            >
              {isMatched ? <Check className="h-3.5 w-3.5" /> : badgeFor(position)}
            </span>

            {side === 'left' ? (
              <span className="flex-1 text-center text-sm font-semibold leading-snug break-words hyphens-auto">
                {pair.portuguese}
              </span>
            ) : (
              <span className="flex flex-1 flex-col items-center justify-center leading-tight">
                <span className="text-sm font-semibold break-words">{pair.english}</span>
                <span className="mt-0.5 font-mono text-[11px] opacity-70">{pair.pronuncia}</span>
              </span>
            )}

            {/* Spacer to keep the word visually centered against the badge. */}
            <span className="h-6 w-6 shrink-0" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {sessionSelector}

      {/* Session progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>
            Desafio <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentChallenge}</span>{' '}
            de {challengesTarget}
          </span>
          <span>
            Erros: <span className="font-bold text-gray-700 dark:text-gray-300">{mistakes}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${sessionProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Transient banners */}
      {advancing && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-300">
          <Sparkles className="h-4 w-4 shrink-0" />
          Desafio concluído! Indo para o próximo…
        </div>
      )}
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
          {renderColumn('left', board.left)}
          {renderColumn('right', board.right)}
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
              onClick={restartChallenge}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar desafio
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
          sozinho — ou use &quot;Zerar memória&quot; para reaparecerem agora.
          {keyboardEnabled
            ? ' Toque em uma palavra e no seu par, ou use as teclas numéricas.'
            : ' Toque em uma palavra e no seu par para combinar.'}
        </p>
      </div>
    </div>
  );
}
