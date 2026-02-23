export type CardStatus = {
  mastered: boolean;
  reviewAfter: number | null; // timestamp in ms, null = not scheduled
  attempts: number;
  correctCount: number;
  lastSeenAt: number | null; // UTC timestamp in ms
};

export type WordCard = {
  id: string;
  type: 'word';
  english: string;
  portuguese: string;
  status: CardStatus;
};

export type SentenceCard = {
  id: string;
  type: 'sentence';
  english: string;
  words: string[];
  portuguese: string;
  status: CardStatus;
};

export type FlashCard = WordCard | SentenceCard;

export type PersistedCardProgress = {
  mastered: boolean;
  reviewAfter: number | null; // UTC timestamp in ms
  attempts: number;
  correctCount: number;
  lastSeenAt: number | null; // UTC timestamp in ms
};

export type PersistedState = {
  version: number; // for future migrations, start at 1
  theme: 'light' | 'dark';
  cardProgress: {
    [cardId: string]: PersistedCardProgress;
  };
};
