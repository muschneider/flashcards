import { FlashCard } from './types';
import { shuffle } from './studyUtils';

export type QueueOptions = {
  type: 'word' | 'sentence';
  allCards: FlashCard[];
  cardsPerSession: number;
};

function isDueForReview(status: FlashCard['status'], now: number): boolean {
  return (
    status.reviewAfter !== null &&
    status.reviewAfter !== undefined &&
    now >= status.reviewAfter &&
    !status.mastered
  );
}

function isUnseen(status: FlashCard['status']): boolean {
  return !status.seen && !status.mastered;
}

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
  const now = Date.now();
  const dueForReview: FlashCard[] = [];
  const unseen: FlashCard[] = [];
  const seenIds = new Set<string>();

  // Single pass through cards
  for (let i = 0; i < allCards.length; i++) {
    const card = allCards[i];
    if (card.type !== type) continue;

    if (isDueForReview(card.status, now)) {
      dueForReview.push(card);
      seenIds.add(card.id);
    } else if (isUnseen(card.status)) {
      unseen.push(card);
    }
  }

  // Merge: shuffled review-due first, then shuffled unseen, cap at cardsPerSession
  const shuffledDue = shuffle(dueForReview);
  const shuffledUnseen = shuffle(unseen);
  const result: FlashCard[] = [];
  const remaining = cardsPerSession;

  // Add shuffled due for review first
  for (let i = 0; i < shuffledDue.length && result.length < remaining; i++) {
    result.push(shuffledDue[i]);
  }

  // Add shuffled unseen cards (skip duplicates)
  for (let i = 0; i < shuffledUnseen.length && result.length < remaining; i++) {
    if (!seenIds.has(shuffledUnseen[i].id)) {
      result.push(shuffledUnseen[i]);
    }
  }

  return result;
}

/**
 * Compute per-type stats from the card list.
 */
export function getTypeStats(
  allCards: FlashCard[],
  type: 'word' | 'sentence',
): { total: number; unseen: number; mastered: number; dueForReview: number } {
  const now = Date.now();
  let total = 0;
  let unseen = 0;
  let mastered = 0;
  let dueForReview = 0;

  for (let i = 0; i < allCards.length; i++) {
    const card = allCards[i];
    if (card.type !== type) continue;

    total++;

    if (card.status.mastered) {
      mastered++;
      if (card.status.reviewAfter !== null && now >= card.status.reviewAfter) {
        dueForReview++;
      }
    } else {
      if (!card.status.seen) {
        unseen++;
      }
      if (card.status.reviewAfter !== null && now >= card.status.reviewAfter) {
        dueForReview++;
      }
    }
  }

  return { total, unseen, mastered, dueForReview };
}
