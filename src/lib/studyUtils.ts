import { FlashCard, WordCard } from './types';

const REVIEW_DELAY_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Returns cards that are due for study:
 * - Not mastered, OR
 * - Mastered but reviewAfter has passed (spaced repetition)
 */
export function getDueCards(cards: FlashCard[]): FlashCard[] {
  const now = Date.now();
  return cards.filter((card) => {
    if (!card.status.mastered) return true;
    if (card.status.reviewAfter && card.status.reviewAfter <= now) return true;
    return false;
  });
}

/**
 * Shuffle an array using Fisher-Yates
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate distractor options for a word card.
 * Returns an array of english words including the correct answer, shuffled.
 */
export function generateWordOptions(
  correctCard: WordCard,
  allWordCards: WordCard[],
  count: number = 4
): string[] {
  const others = allWordCards
    .filter((c) => c.id !== correctCard.id)
    .map((c) => c.english);

  const distractors = shuffle(others).slice(0, count - 1);
  const options = [...distractors, correctCard.english];
  return shuffle(options);
}

/**
 * Calculate the review timestamp after a correct answer.
 * Uses simple spaced repetition: delay increases with correct count.
 */
export function getNextReviewTime(correctCount: number): number {
  // Exponential backoff: 2min, 10min, 30min, 1h, 3h, 8h...
  const multipliers = [1, 5, 15, 30, 90, 240, 720];
  const index = Math.min(correctCount, multipliers.length - 1);
  return Date.now() + REVIEW_DELAY_MS * multipliers[index];
}

/**
 * Get the delay for re-showing a wrong answer within a session.
 * Card reappears after N other cards (minimum 3).
 */
export function getReinsertionIndex(queueLength: number): number {
  return Math.min(3, Math.max(1, Math.floor(queueLength / 2)));
}
