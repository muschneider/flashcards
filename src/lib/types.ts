export type CardStatus = {
  mastered: boolean;
  reviewAfter: number | null; // timestamp in ms, null = not scheduled
  attempts: number;
  correctCount: number;
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
