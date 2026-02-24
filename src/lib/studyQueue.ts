import { FlashCard } from './types';

export type QueueOptions = {
  type: 'word' | 'sentence';
  allCards: FlashCard[];
  cardsPerSession: number;
};

/**
 * Build a study queue for a session.
 *
 * Priority order:
 * 1. Cards due for re-review (answered wrong previously, timer has expired)
 * 2. Unseen cards (never shown in any session)
 * 3. Never include already-mastered cards (unless reset)
 * 4. Cap the total at cardsPerSession
 */
export function buildStudyQueue(options: QueueOptions): FlashCard[] {
  const { type, allCards, cardsPerSession } = options;

  // 1. Filter by type
  const ofType = allCards.filter((c) => c.type === type);

  // 2. Due for re-review (wrong answer, timer expired) — highest priority
  const now = Date.now();
  const dueForReview = ofType.filter((c) => {
    const s = c.status;
    return (
      s.reviewAfter !== null &&
      s.reviewAfter !== undefined &&
      now >= s.reviewAfter &&
      !s.mastered
    );
  });

  // 3. Never seen before (unseen cards) — second priority
  const unseen = ofType.filter((c) => {
    return !c.status.seen && !c.status.mastered;
  });

  // 4. Merge: review-due first, then unseen, deduplicate, cap at cardsPerSession
  const reviewIds = new Set(dueForReview.map((c) => c.id));
  const merged = [
    ...dueForReview,
    ...unseen.filter((c) => !reviewIds.has(c.id)),
  ];

  return merged.slice(0, cardsPerSession);
}

/**
 * Compute per-type stats from the card list.
 */
export function getTypeStats(
  allCards: FlashCard[],
  type: 'word' | 'sentence',
): { total: number; unseen: number; mastered: number; dueForReview: number } {
  const ofType = allCards.filter((c) => c.type === type);
  const now = Date.now();

  return {
    total: ofType.length,
    unseen: ofType.filter((c) => !c.status.seen && !c.status.mastered).length,
    mastered: ofType.filter((c) => c.status.mastered).length,
    dueForReview: ofType.filter(
      (c) =>
        c.status.reviewAfter !== null &&
        now >= c.status.reviewAfter &&
        !c.status.mastered,
    ).length,
  };
}
