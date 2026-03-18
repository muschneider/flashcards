'use client';

import { useRouter } from 'next/navigation';
import { useCards } from '@/context/CardContext';
import { SentenceCard as SentenceCardType } from '@/lib/types';
import { useStudySession } from '@/hooks/useStudySession';
import SentenceCard from '@/components/SentenceCard';
import StudyEmptyState from '@/components/StudyEmptyState';
import StudyCompleteState from '@/components/StudyCompleteState';
import StudyProgress from '@/components/StudyProgress';

export default function StudySentencesPage() {
  const router = useRouter();
  const { cards, settings, resetProgress } = useCards();

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
    handleSkip,
  } = useStudySession({
    queueOptions: {
      type: 'sentence',
      allCards: cards,
      cardsPerSession: settings.sentences.cardsPerSession,
    },
  });

  if (isComplete && sessionTotal === 0) {
    return (
      <StudyEmptyState
        title="No cards left for this session!"
        description="All sentences have been seen or mastered."
        resetLabel="Reset Sentence Progress"
        onReset={() => {
          resetProgress('sentence');
          router.refresh();
        }}
        color="emerald"
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
        itemLabel="Sentences"
      />
    );
  }

  return (
    <div className="space-y-6">
      <StudyProgress
        completed={completed}
        sessionTotal={sessionTotal}
        itemLabel="Sentence"
        color="emerald"
      />

      {currentCard && currentCard.type === 'sentence' && (
        <SentenceCard
          key={cardKey}
          card={currentCard as SentenceCardType}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}
