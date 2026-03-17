'use client';

import { useMemo } from 'react';
import { useCards } from '@/context/CardContext';
import { generateWordOptions } from '@/lib/studyUtils';
import { WordCard as WordCardType, SentenceCard as SentenceCardType } from '@/lib/types';
import { useStudySession } from '@/hooks/useStudySession';
import WordCard from '@/components/WordCard';
import SentenceCard from '@/components/SentenceCard';
import StudyEmptyState from '@/components/StudyEmptyState';
import StudyCompleteState from '@/components/StudyCompleteState';
import StudyProgress from '@/components/StudyProgress';

export default function StudyAllPage() {
  const { cards, wordCards, settings } = useCards();

  const {
    currentCard,
    completed,
    correctOnFirst,
    needReview,
    sessionTotal,
    isComplete,
    cardKey,
    handleCorrect,
    handleWrong,
  } = useStudySession({
    queueOptions: [
      {
        type: 'word',
        allCards: cards,
        cardsPerSession: settings.words.cardsPerSession,
      },
      {
        type: 'sentence',
        allCards: cards,
        cardsPerSession: settings.sentences.cardsPerSession,
      },
    ],
  });

  const wordOptions = useMemo(() => {
    if (!currentCard || currentCard.type !== 'word') return [];
    return generateWordOptions(currentCard as WordCardType, wordCards);
  }, [currentCard, wordCards]);

  if (isComplete && sessionTotal === 0) {
    return (
      <StudyEmptyState
        title="No cards to study!"
        description="All cards have been seen or mastered. Reset progress in Settings to study again."
        color="purple"
      />
    );
  }

  if (isComplete) {
    return (
      <StudyCompleteState
        title="Session Complete!"
        completed={completed}
        correctOnFirst={correctOnFirst}
        needReview={needReview}
        itemLabel="Cards"
      />
    );
  }

  return (
    <div className="space-y-6">
      <StudyProgress
        completed={completed}
        sessionTotal={sessionTotal}
        itemLabel="Card"
        color="purple"
      />

      {currentCard && currentCard.type === 'word' && (
        <WordCard
          key={cardKey}
          card={currentCard as WordCardType}
          options={wordOptions}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      )}
      {currentCard && currentCard.type === 'sentence' && (
        <SentenceCard
          key={cardKey}
          card={currentCard as SentenceCardType}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      )}
    </div>
  );
}
