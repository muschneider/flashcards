import { PersistedState, SessionSettings } from './types';

const STORAGE_KEY = 'english_trainer_state';
const CURRENT_VERSION = 2;

export const DEFAULT_SETTINGS: SessionSettings = {
  words: { cardsPerSession: 10 },
  sentences: { cardsPerSession: 5 },
};

// Migrate v1 state to v2 by adding settings and seen field
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV1toV2(old: any): PersistedState {
  const cardProgress: PersistedState['cardProgress'] = {};

  if (old.cardProgress) {
    for (const [id, p] of Object.entries(old.cardProgress)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progress = p as any;
      cardProgress[id] = {
        type: id.startsWith('s') ? 'sentence' : 'word',
        mastered: progress.mastered ?? false,
        seen: progress.attempts > 0 || progress.mastered || progress.lastSeenAt !== null,
        reviewAfter: progress.reviewAfter ?? null,
        attempts: progress.attempts ?? 0,
        correctCount: progress.correctCount ?? 0,
        lastSeenAt: progress.lastSeenAt ?? null,
      };
    }
  }

  return {
    version: CURRENT_VERSION,
    theme: old.theme ?? 'light',
    settings: { ...DEFAULT_SETTINGS },
    cardProgress,
  };
}

export function loadState(): PersistedState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(raw) as any;

    // Migrate from v1 to v2
    if (parsed.version === 1) {
      const migrated = migrateV1toV2(parsed);
      saveState(migrated);
      return migrated;
    }

    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage quota exceeded or private mode — fail silently
  }
}

export function clearState(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}
