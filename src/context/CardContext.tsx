'use client';

import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';
import { FlashCard, WordCard, SentenceCard, CardStatus, PersistedState } from '@/lib/types';
import { defaultWordCards, defaultSentenceCards } from '@/lib/defaultCards';
import { getNextReviewTime } from '@/lib/studyUtils';
import { loadState } from '@/lib/storage';

// ─── State ──────────────────────────────────────────────
type CardState = {
  cards: FlashCard[];
  nextId: number;
};

// ─── Actions ────────────────────────────────────────────
type CardAction =
  | { type: 'ADD_WORD'; english: string; portuguese: string }
  | { type: 'ADD_SENTENCE'; english: string; portuguese: string }
  | { type: 'DELETE_CARD'; id: string }
  | { type: 'MARK_CORRECT'; id: string }
  | { type: 'MARK_WRONG'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; payload: PersistedState };

const defaultStatus: CardStatus = {
  mastered: false,
  reviewAfter: null,
  attempts: 0,
  correctCount: 0,
  lastSeenAt: null,
};

const initialState: CardState = {
  cards: [...defaultWordCards, ...defaultSentenceCards],
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
              attempts: c.status.attempts + 1,
              reviewAfter: null,
              lastSeenAt: Date.now(),
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

    case 'HYDRATE': {
      const { cardProgress } = action.payload;
      return {
        ...state,
        cards: state.cards.map((c) => {
          const saved = cardProgress[c.id];
          if (!saved) return c;
          return {
            ...c,
            status: {
              mastered: saved.mastered,
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
      mastered: card.status.mastered,
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
  addWord: (english: string, portuguese: string) => void;
  addSentence: (english: string, portuguese: string) => void;
  deleteCard: (id: string) => void;
  markCorrect: (id: string) => void;
  markWrong: (id: string) => void;
  resetAll: () => void;
  hydrated: boolean;
  stats: {
    total: number;
    mastered: number;
    pending: number;
    dueForReview: number;
  };
};

const CardContext = createContext<CardContextType | undefined>(undefined);

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

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const wordCards = state.cards.filter((c): c is WordCard => c.type === 'word');
  const sentenceCards = state.cards.filter((c): c is SentenceCard => c.type === 'sentence');

  const now = Date.now();
  const stats = {
    total: state.cards.length,
    mastered: state.cards.filter((c) => c.status.mastered).length,
    pending: state.cards.filter((c) => !c.status.mastered).length,
    dueForReview: state.cards.filter(
      (c) => c.status.mastered && c.status.reviewAfter !== null && c.status.reviewAfter <= now
    ).length,
  };

  return (
    <CardContext.Provider
      value={{
        cards: state.cards,
        wordCards,
        sentenceCards,
        addWord,
        addSentence,
        deleteCard,
        markCorrect,
        markWrong,
        resetAll,
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
