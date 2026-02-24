import { WordCard, SentenceCard, CardStatus } from './types';
import vocab from '@/data/vocab.json';

const defaultStatus: CardStatus = {
  mastered: false,
  seen: false,
  reviewAfter: null,
  attempts: 0,
  correctCount: 0,
  lastSeenAt: null,
};

export const defaultWordCards: WordCard[] = vocab.words.map((item, index) => ({
  id: `w${index + 1}`,
  type: 'word',
  english: item.english,
  portuguese: item.portuguese,
  status: { ...defaultStatus },
}));

export const defaultSentenceCards: SentenceCard[] = vocab.sentences.map((item, index) => ({
  id: `s${index + 1}`,
  type: 'sentence',
  english: item.english,
  words: item.english.split(/\s+/),
  portuguese: item.portuguese,
  status: { ...defaultStatus },
}));
