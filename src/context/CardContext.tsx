'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useSyncExternalStore, useState, useEffect } from 'react';
import { FlashCard, WordCard, SentenceCard, CardStatus, PersistedState, SessionSettings } from '@/lib/types';
import { defaultWordCards, defaultSentenceCards } from '@/lib/defaultCards';
import { getNextReviewTime } from '@/lib/studyUtils';
import { loadState, DEFAULT_SETTINGS } from '@/lib/storage';

// ─── State ──────────────────────────────────────────────
type CardState = {
  cards: FlashCard[];
  settings: SessionSettings;
  nextId: number;
};

// ─── Actions ────────────────────────────────────────────
type CardAction =
  | { type: 'ADD_WORD'; english: string; portuguese: string }
  | { type: 'ADD_SENTENCE'; english: string; portuguese: string }
  | { type: 'DELETE_CARD'; id: string }
  | { type: 'MARK_CORRECT'; id: string }
  | { type: 'MARK_WRONG'; id: string }
  | { type: 'MARK_SEEN'; payload: { cardId: string } }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_PROGRESS'; payload: { cardType: 'word' | 'sentence' } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SessionSettings> }
  | { type: 'HYDRATE'; payload: PersistedState };

// Wrong answers become "due for review" after 2 minutes
const WRONG_REVIEW_DELAY_MS = 2 * 60 * 1000;

const defaultStatus: CardStatus = {
  mastered: false,
  seen: false,
  reviewAfter: null,
  attempts: 0,
  correctCount: 0,
  lastSeenAt: null,
};

const initialState: CardState = {
  cards: [...defaultWordCards, ...defaultSentenceCards],
  settings: { ...DEFAULT_SETTINGS },
  nextId: 100,
};

function cardReducer(state: CardState, action: CardAction): CardState {
  switch (action.type) {
    case 'ADD_WORD': {
      const newCard: WordCard = {
        id: `w${state.nextId}`,
        type: 'word',
        english: action.english.trim(),
        portuguese: action.portuguese.trim(),
        status: { ...defaultStatus },
      };
      return {
        ...state,
        cards: [...state.cards, newCard],
        nextId: state.nextId + 1,
      };
    }

    case 'ADD_SENTENCE': {
      const english = action.english.trim();
      const newCard: SentenceCard = {
        id: `s${state.nextId}`,
        type: 'sentence',
        english,
        words: english.split(/\s+/),
        portuguese: action.portuguese.trim(),
        status: { ...defaultStatus },
      };
      return {
        ...state,
        cards: [...state.cards, newCard],
        nextId: state.nextId + 1,
      };
    }

    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.id),
      };

    case 'MARK_CORRECT':
      return {
        ...state,
        cards: state.cards.map((c) => {
          if (c.id !== action.id) return c;
          const newCorrectCount = c.status.correctCount + 1;
          return {
            ...c,
            status: {
              ...c.status,
              mastered: true,
              seen: true,
              attempts: c.status.attempts + 1,
              correctCount: newCorrectCount,
              reviewAfter: getNextReviewTime(newCorrectCount),
              lastSeenAt: Date.now(),
            },
          };
        }),
      };

    case 'MARK_WRONG':
      return {
        ...state,
        cards: state.cards.map((c) => {
          if (c.id !== action.id) return c;
          return {
            ...c,
            status: {
              ...c.status,
              mastered: false,
              seen: true,
              attempts: c.status.attempts + 1,
              reviewAfter: Date.now() + WRONG_REVIEW_DELAY_MS,
              lastSeenAt: Date.now(),
            },
          };
        }),
      };

    case 'MARK_SEEN':
      return {
        ...state,
        cards: state.cards.map((c) => {
          if (c.id !== action.payload.cardId) return c;
          if (c.status.seen) return c; // already seen, no-op
          return {
            ...c,
            status: {
              ...c.status,
              seen: true,
              lastSeenAt: c.status.lastSeenAt ?? Date.now(),
            },
          };
        }),
      };

    case 'RESET_ALL':
      return {
        ...state,
        cards: state.cards.map((c) => ({
          ...c,
          status: { ...defaultStatus },
        })),
      };

    case 'RESET_PROGRESS': {
      const { cardType } = action.payload;
      return {
        ...state,
        cards: state.cards.map((c) => {
          if (c.type !== cardType) return c;
          return {
            ...c,
            status: { ...defaultStatus },
          };
        }),
      };
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case 'HYDRATE': {
      const { cardProgress, settings } = action.payload;
      return {
        ...state,
        settings: settings ?? { ...DEFAULT_SETTINGS },
        cards: state.cards.map((c) => {
          const saved = cardProgress[c.id];
          if (!saved) return c;
          return {
            ...c,
            status: {
              mastered: saved.mastered,
              seen: saved.seen ?? false,
              reviewAfter: saved.reviewAfter,
              attempts: saved.attempts,
              correctCount: saved.correctCount,
              lastSeenAt: saved.lastSeenAt,
            },
          };
        }),
      };
    }

    default:
      return state;
  }
}

// ─── Helper to extract progress for persistence ─────────
export function extractProgress(cards: FlashCard[]): PersistedState['cardProgress'] {
  const progress: PersistedState['cardProgress'] = {};
  for (const card of cards) {
    progress[card.id] = {
      type: card.type,
      mastered: card.status.mastered,
      seen: card.status.seen,
      reviewAfter: card.status.reviewAfter,
      attempts: card.status.attempts,
      correctCount: card.status.correctCount,
      lastSeenAt: card.status.lastSeenAt,
    };
  }
  return progress;
}

// ─── Context ────────────────────────────────────────────
type CardContextType = {
  cards: FlashCard[];
  wordCards: WordCard[];
  sentenceCards: SentenceCard[];
  settings: SessionSettings;
  addWord: (english: string, portuguese: string) => void;
  addSentence: (english: string, portuguese: string) => void;
  deleteCard: (id: string) => void;
  markCorrect: (id: string) => void;
  markWrong: (id: string) => void;
  markSeen: (cardId: string) => void;
  resetAll: () => void;
  resetProgress: (cardType: 'word' | 'sentence') => void;
  updateSettings: (settings: Partial<SessionSettings>) => void;
  hydrated: boolean;
  stats: {
    total: number;
    mastered: number;
    pending: number;
    dueForReview: number;
  };
};

const CardContext = createContext<CardContextType | undefined>(undefined);

// External time store — updates every 30s so dueForReview stays fresh
// without calling Date.now() during render
let _now = Date.now();
const _listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  setInterval(() => {
    _now = Date.now();
    _listeners.forEach((l) => l());
  }, 30_000);
}
function subscribeToTime(listener: () => void) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}
function getTimeSnapshot() { return _now; }
function getServerTimeSnapshot() { return 0; }

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cardReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      dispatch({ type: 'HYDRATE', payload: saved });
    }
    setHydrated(true);
  }, []);

  const addWord = useCallback((english: string, portuguese: string) => {
    dispatch({ type: 'ADD_WORD', english, portuguese });
  }, []);

  const addSentence = useCallback((english: string, portuguese: string) => {
    dispatch({ type: 'ADD_SENTENCE', english, portuguese });
  }, []);

  const deleteCard = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CARD', id });
  }, []);

  const markCorrect = useCallback((id: string) => {
    dispatch({ type: 'MARK_CORRECT', id });
  }, []);

  const markWrong = useCallback((id: string) => {
    dispatch({ type: 'MARK_WRONG', id });
  }, []);

  const markSeen = useCallback((cardId: string) => {
    dispatch({ type: 'MARK_SEEN', payload: { cardId } });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const resetProgress = useCallback((cardType: 'word' | 'sentence') => {
    dispatch({ type: 'RESET_PROGRESS', payload: { cardType } });
  }, []);

  const updateSettings = useCallback((settings: Partial<SessionSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const wordCards = state.cards.filter((c): c is WordCard => c.type === 'word');
  const sentenceCards = state.cards.filter((c): c is SentenceCard => c.type === 'sentence');

  const now = useSyncExternalStore(subscribeToTime, getTimeSnapshot, getServerTimeSnapshot);
  const stats = useMemo(() => ({
    total: state.cards.length,
    mastered: state.cards.filter((c) => c.status.mastered).length,
    pending: state.cards.filter((c) => !c.status.mastered).length,
    dueForReview: state.cards.filter(
      (c) => c.status.mastered && c.status.reviewAfter !== null && c.status.reviewAfter <= now,
    ).length,
  }), [state.cards, now]);

  return (
    <CardContext.Provider
      value={{
        cards: state.cards,
        wordCards,
        sentenceCards,
        settings: state.settings,
        addWord,
        addSentence,
        deleteCard,
        markCorrect,
        markWrong,
        markSeen,
        resetAll,
        resetProgress,
        updateSettings,
        hydrated,
        stats,
      }}
    >
      {children}
    </CardContext.Provider>
  );
}

export function useCards() {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCards must be used within a CardProvider');
  }
  return context;
}
