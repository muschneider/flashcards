// Word pairs for the "Combine os pares" module (/modules/match-pairs).
//
// Every pair comes straight from the "words" list in vocab.json — the same
// source the flashcard deck uses — reusing the exact id scheme from
// defaultCards.ts (w1, w2, ...) so ids stay consistent across the app.

import vocab from '@/data/vocab.json';

export type WordPair = {
  id: string;
  english: string; // English word
  portuguese: string; // Portuguese meaning
  pronuncia: string; // Portuguese-style respelling (memory anchor)
};

export const wordPairs: WordPair[] = vocab.words.map((item, index) => ({
  id: `w${index + 1}`,
  english: item.english,
  portuguese: item.portuguese,
  pronuncia: item.pronuncia,
}));
