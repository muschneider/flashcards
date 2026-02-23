import { WordCard, SentenceCard, CardStatus } from './types';

const defaultStatus: CardStatus = {
  mastered: false,
  reviewAfter: null,
  attempts: 0,
  correctCount: 0,
};

export const defaultWordCards: WordCard[] = [
  { id: 'w1', type: 'word', english: 'house', portuguese: 'casa', status: { ...defaultStatus } },
  { id: 'w2', type: 'word', english: 'dog', portuguese: 'cachorro', status: { ...defaultStatus } },
  { id: 'w3', type: 'word', english: 'cat', portuguese: 'gato', status: { ...defaultStatus } },
  { id: 'w4', type: 'word', english: 'water', portuguese: 'água', status: { ...defaultStatus } },
  { id: 'w5', type: 'word', english: 'book', portuguese: 'livro', status: { ...defaultStatus } },
  { id: 'w6', type: 'word', english: 'friend', portuguese: 'amigo', status: { ...defaultStatus } },
  { id: 'w7', type: 'word', english: 'food', portuguese: 'comida', status: { ...defaultStatus } },
  { id: 'w8', type: 'word', english: 'school', portuguese: 'escola', status: { ...defaultStatus } },
  { id: 'w9', type: 'word', english: 'time', portuguese: 'tempo', status: { ...defaultStatus } },
  { id: 'w10', type: 'word', english: 'love', portuguese: 'amor', status: { ...defaultStatus } },
  { id: 'w11', type: 'word', english: 'sun', portuguese: 'sol', status: { ...defaultStatus } },
  { id: 'w12', type: 'word', english: 'moon', portuguese: 'lua', status: { ...defaultStatus } },
];

function makeSentenceCard(id: string, english: string, portuguese: string): SentenceCard {
  return {
    id,
    type: 'sentence',
    english,
    words: english.split(/\s+/),
    portuguese,
    status: { ...defaultStatus },
  };
}

export const defaultSentenceCards: SentenceCard[] = [
  makeSentenceCard('s1', 'I am learning English', 'Eu estou aprendendo inglês'),
  makeSentenceCard('s2', 'The dog is very happy', 'O cachorro está muito feliz'),
  makeSentenceCard('s3', 'She reads a book every day', 'Ela lê um livro todos os dias'),
  makeSentenceCard('s4', 'We love to eat food', 'Nós amamos comer comida'),
  makeSentenceCard('s5', 'The sun is bright today', 'O sol está brilhante hoje'),
  makeSentenceCard('s6', 'My friend goes to school', 'Meu amigo vai para a escola'),
  makeSentenceCard('s7', 'Time flies very fast', 'O tempo voa muito rápido'),
];
