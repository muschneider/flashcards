'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCards } from '@/context/CardContext';
import { generateWordOptions } from '@/lib/studyUtils';
import { WordCard as WordCardType } from '@/lib/types';
import { useStudySession } from '@/hooks/useStudySession';
import StudyEmptyState from '@/components/StudyEmptyState';
import StudyCompleteState from '@/components/StudyCompleteState';
import StudyProgress from '@/components/StudyProgress';

const WordCard = dynamic(() => import('@/components/WordCard'), { ssr: false });

export default function StudyWordsPage() {
  const router = useRouter();
  const { cards, wordCards, settings, resetProgress } = useCards();

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
    queueOptions: {
      type: 'word',
      allCards: cards,
      cardsPerSession: settings.words.cardsPerSession,
    },
  });

  const typedCard = currentCard?.type === 'word' ? (currentCard as WordCardType) : null;

  const wordOptions = useMemo(() => {
    if (!typedCard) return [];
    return generateWordOptions(typedCard, wordCards);
  }, [typedCard, wordCards]);

  if (isComplete && sessionTotal === 0) {
    return (
      <StudyEmptyState
        title="No cards left for this session!"
        description="All words have been seen or mastered."
        resetLabel="Reset Word Progress"
        onReset={() => {
          resetProgress('word');
          router.refresh();
        }}
        color="indigo"
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
        itemLabel="Words"
      />
    );
  }

  return (
    <div className="space-y-6">
      <StudyProgress
        completed={completed}
        sessionTotal={sessionTotal}
        itemLabel="Word"
        color="indigo"
      />

      {typedCard && (
        <WordCard
          key={cardKey}
          card={typedCard}
          options={wordOptions}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
        />
      )}
    </div>
  );
}
