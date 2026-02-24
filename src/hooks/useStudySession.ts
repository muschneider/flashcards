'use client';

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { FlashCard } from '@/lib/types';
import { shuffle } from '@/lib/studyUtils';
import { buildStudyQueue, QueueOptions } from '@/lib/studyQueue';
import { useCards } from '@/context/CardContext';

// ─── Session State ───────────────────────────────────────
type SessionState = {
  queue: FlashCard[];
  currentIndex: number;
  completed: number;
  correctOnFirst: number;
  needReview: number;
  sessionTotal: number;
  isComplete: boolean;
  cardKey: number;
};

type SessionAction =
  | { type: 'INIT'; payload: { queue: FlashCard[] } }
  | { type: 'ADVANCE' }
  | { type: 'CORRECT' }
  | { type: 'WRONG'; payload: { card: FlashCard; currentIndex: number } };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'INIT': {
      const { queue } = action.payload;
      return {
        queue,
        currentIndex: 0,
        completed: 0,
        correctOnFirst: 0,
        needReview: 0,
        sessionTotal: queue.length,
        isComplete: queue.length === 0,
        cardKey: 0,
      };
    }

    case 'ADVANCE': {
      const newCompleted = state.completed + 1;
      const nextIndex = state.currentIndex + 1;
      const done = nextIndex >= state.queue.length;
      return {
        ...state,
        completed: newCompleted,
        cardKey: state.cardKey + 1,
        currentIndex: done ? state.currentIndex : nextIndex,
        isComplete: done,
      };
    }

    case 'CORRECT':
      return {
        ...state,
        correctOnFirst: state.correctOnFirst + 1,
      };

    case 'WRONG': {
      const { card, currentIndex } = action.payload;
      const newQueue = [...state.queue];
      const reinsertAt = Math.min(currentIndex + 4, newQueue.length);
      newQueue.splice(reinsertAt, 0, card);
      return {
        ...state,
        queue: newQueue,
        needReview: state.needReview + 1,
        sessionTotal: state.sessionTotal + 1,
        cardKey: state.cardKey + 1,
        currentIndex: state.currentIndex + 1,
      };
    }

    default:
      return state;
  }
}

// ─── Build initial session state (called outside of render) ──
function buildInitialSession(
  queueOptions: QueueOptions | QueueOptions[],
): SessionState {
  const options = Array.isArray(queueOptions) ? queueOptions : [queueOptions];
  const allQueued = options.flatMap((opt) => buildStudyQueue(opt));
  const queue = shuffle(allQueued);
  return {
    queue,
    currentIndex: 0,
    completed: 0,
    correctOnFirst: 0,
    needReview: 0,
    sessionTotal: queue.length,
    isComplete: queue.length === 0,
    cardKey: 0,
  };
}

// ─── Hook ────────────────────────────────────────────────
type UseStudySessionOptions = {
  queueOptions: QueueOptions | QueueOptions[];
};

export function useStudySession({ queueOptions }: UseStudySessionOptions) {
  const { markCorrect: ctxMarkCorrect, markWrong: ctxMarkWrong, markSeen } = useCards();

  const [session, dispatch] = useReducer(
    sessionReducer,
    queueOptions,
    (opts) => buildInitialSession(opts),
  );

  const currentCard = session.queue[session.currentIndex] || null;

  // Track whether we've already initialized to avoid re-init
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
  }, []);

  // Mark card as seen when it's displayed
  useEffect(() => {
    if (currentCard) {
      markSeen(currentCard.id);
    }
  }, [currentCard, markSeen]);

  const handleCorrect = useCallback(() => {
    if (!currentCard) return;
    ctxMarkCorrect(currentCard.id);
    dispatch({ type: 'CORRECT' });
    dispatch({ type: 'ADVANCE' });
  }, [currentCard, ctxMarkCorrect]);

  const handleWrong = useCallback(() => {
    if (!currentCard) return;
    ctxMarkWrong(currentCard.id);
    dispatch({
      type: 'WRONG',
      payload: { card: currentCard, currentIndex: session.currentIndex },
    });
  }, [currentCard, ctxMarkWrong, session.currentIndex]);

  return {
    queue: session.queue,
    currentCard,
    currentIndex: session.currentIndex,
    completed: session.completed,
    correctOnFirst: session.correctOnFirst,
    needReview: session.needReview,
    sessionTotal: session.sessionTotal,
    isComplete: session.isComplete,
    cardKey: session.cardKey,
    handleCorrect,
    handleWrong,
  };
}
