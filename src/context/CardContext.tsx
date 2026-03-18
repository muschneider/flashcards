'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { FlashCard, WordCard, SentenceCard, CardStatus, PersistedState, SessionSettings } from '@/lib/types';
import { defaultWordCards, defaultSentenceCards } from '@/lib/defaultCards';
import { getNextReviewTime } from '@/lib/studyUtils';
import { loadState, DEFAULT_SETTINGS, saveState } from '@/lib/storage';

// ─── State ──────────────────────────────────────────────
type CardState = {
  cards: FlashCard[];
  settings: SessionSettings;
  nextId: number;
};

// ─── Actions ────────────────────────────────────────────
type CardAction =
  | { type: 'ADD_WORD'; english: string; portuguese: string; tipo: string; pronunciacion: string; example: string }
  | { type: 'ADD_SENTENCE'; english: string; portuguese: string }
  | { type: 'DELETE_CARD'; id: string }
  | { type: 'MARK_CORRECT'; id: string }
  | { type: 'MARK_WRONG'; id: string }
  | { type: 'MARK_SEEN'; payload: { cardId: string } }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_PROGRESS'; payload: { cardType: 'word' | 'sentence' } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SessionSettings> }
  | { type: 'HYDRATE'; payload: PersistedState };

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
        tipo: action.tipo.trim(),
        pronunciacion: action.pronunciacion.trim(),
        example: action.example.trim(),
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
          if (c.status.seen) return c;
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
type Stats = {
  total: number;
  mastered: number;
  pending: number;
  unseen: number;
  dueForReview: number;
};

type CardContextType = {
  cards: FlashCard[];
  wordCards: WordCard[];
  sentenceCards: SentenceCard[];
  settings: SessionSettings;
  addWord: (english: string, portuguese: string, tipo?: string, pronunciacion?: string, example?: string) => void;
  addSentence: (english: string, portuguese: string) => void;
  deleteCard: (id: string) => void;
  markCorrect: (id: string) => void;
  markWrong: (id: string) => void;
  markSeen: (cardId: string) => void;
  resetAll: () => void;
  resetProgress: (cardType: 'word' | 'sentence') => void;
  updateSettings: (settings: Partial<SessionSettings>) => void;
  hydrated: boolean;
  stats: Stats;
  getWordStats: () => Stats;
  getSentenceStats: () => Stats;
};

const CardContext = createContext<CardContextType | undefined>(undefined);

// Time tracking for dueForReview calculations
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

function getTimeSnapshot() {
  return _now;
}

function getServerTimeSnapshot() {
  return 0;
}

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cardReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      dispatch({ type: 'HYDRATE', payload: saved });
    }
    setHydrated(true);
  }, []);

  // Memoized card filters
  const wordCards = useMemo(
    () => state.cards.filter((c): c is WordCard => c.type === 'word'),
    [state.cards]
  );

  const sentenceCards = useMemo(
    () => state.cards.filter((c): c is SentenceCard => c.type === 'sentence'),
    [state.cards]
  );

  // Get current time from external store
  const now = useSyncExternalStore(subscribeToTime, getTimeSnapshot, getServerTimeSnapshot);

  // Memoized stats computation
  const stats = useMemo<Stats>(() => {
    const cards = state.cards;
    let mastered = 0;
    let pending = 0;
    let unseen = 0;
    let dueForReview = 0;

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (c.status.mastered) {
        mastered++;
        if (c.status.reviewAfter !== null && c.status.reviewAfter <= now) {
          dueForReview++;
        }
      } else {
        pending++;
        if (!c.status.seen) {
          unseen++;
        }
        if (c.status.reviewAfter !== null && c.status.reviewAfter <= now) {
          dueForReview++;
        }
      }
    }

    return {
      total: cards.length,
      mastered,
      pending,
      unseen,
      dueForReview,
    };
  }, [state, now]);

  // Memoized type-specific stats getters
  const getWordStats = useCallback((): Stats => {
    let mastered = 0;
    let pending = 0;
    let unseen = 0;
    let dueForReview = 0;

    for (let i = 0; i < wordCards.length; i++) {
      const c = wordCards[i];
      if (c.status.mastered) {
        mastered++;
        if (c.status.reviewAfter !== null && c.status.reviewAfter <= now) {
          dueForReview++;
        }
      } else {
        pending++;
        if (!c.status.seen) {
          unseen++;
        }
        if (c.status.reviewAfter !== null && c.status.reviewAfter <= now) {
          dueForReview++;
        }
      }
    }

    return {
      total: wordCards.length,
      mastered,
      pending,
      unseen,
      dueForReview,
    };
  }, [wordCards, now]);

  const getSentenceStats = useCallback((): Stats => {
    let mastered = 0;
    let pending = 0;
    let unseen = 0;
    let dueForReview = 0;

    for (let i = 0; i < sentenceCards.length; i++) {
      const c = sentenceCards[i];
      if (c.status.mastered) {
        mastered++;
        if (c.status.reviewAfter !== null && c.status.reviewAfter <= now) {
          dueForReview++;
        }
      } else {
        pending++;
        if (!c.status.seen) {
          unseen++;
        }
        if (c.status.reviewAfter !== null && c.status.reviewAfter <= now) {
          dueForReview++;
        }
      }
    }

    return {
      total: sentenceCards.length,
      mastered,
      pending,
      unseen,
      dueForReview,
    };
  }, [sentenceCards, now]);

  // Memoized action creators
  const addWord = useCallback(
    (english: string, portuguese: string, tipo = '', pronunciacion = '', example = '') => {
      dispatch({ type: 'ADD_WORD', english, portuguese, tipo, pronunciacion, example });
    },
    []
  );

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

  // Debounced persistence
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      // Note: Theme is handled separately in ThemeContext
      saveState({
        version: 2,
        theme: 'light', // Will be updated by ThemeContext
        settings: state.settings,
        cardProgress: extractProgress(state.cards),
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.cards, state.settings, hydrated]);

  const value = useMemo<CardContextType>(
    () => ({
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
      getWordStats,
      getSentenceStats,
    }),
    [
      state.cards,
      state.settings,
      wordCards,
      sentenceCards,
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
      getWordStats,
      getSentenceStats,
    ]
  );

  return (
    <CardContext.Provider value={value}>
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
