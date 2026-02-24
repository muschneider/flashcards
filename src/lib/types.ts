export type CardStatus = {
  mastered: boolean;
  seen: boolean; // true after card is shown at least once
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
  type: 'word' | 'sentence';
  mastered: boolean;
  seen: boolean; // true after card is shown at least once
  reviewAfter: number | null; // UTC timestamp in ms
  attempts: number;
  correctCount: number;
  lastSeenAt: number | null; // UTC timestamp in ms
};

export type SessionSettings = {
  words: {
    cardsPerSession: number; // default: 10
  };
  sentences: {
    cardsPerSession: number; // default: 5
  };
};

export type PersistedState = {
  version: number; // for future migrations, start at 2
  theme: 'light' | 'dark';
  settings: SessionSettings;
  cardProgress: {
    [cardId: string]: PersistedCardProgress;
  };
};
