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

export type WordOption = {
  word: string;
  pronunciacion: string;
};

/**
 * Generate distractor options for a word card.
 * Uses all random_words from the card if available, plus the correct answer.
 * Otherwise falls back to other cards from the deck.
 */
export function generateWordOptions(
  correctCard: WordCard,
  allWordCards: WordCard[],
  count: number = 4
): WordOption[] {
  let options: WordOption[];

  if (correctCard.randomWords && correctCard.randomWords.length > 0) {
    const distractors = correctCard.randomWords.map((rw) => ({
      word: rw.word,
      pronunciacion: rw.pronunciacion,
    }));
    const correctOption = { word: correctCard.english, pronunciacion: correctCard.pronunciacion };
    options = [...distractors, correctOption];
  } else {
    const others = allWordCards
      .filter((c) => c.id !== correctCard.id)
      .map((c) => ({ word: c.english, pronunciacion: c.pronunciacion }));
    const selectedDistractors = shuffle(others).slice(0, count - 1);
    const correctOption = { word: correctCard.english, pronunciacion: correctCard.pronunciacion };
    options = [...selectedDistractors, correctOption];
    options = shuffle(options);
  }

  return options;
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
