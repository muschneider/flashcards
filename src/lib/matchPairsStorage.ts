// Lightweight, self-contained persistence for the "Combine os pares" module.
// It only remembers which word IDs were already practiced in the current cycle
// so the game does not repeat them until every word has been seen.

// Bumped to v2 when the word source moved to vocab.json (ids changed to w1, w2…).
const STORAGE_KEY = 'match_pairs_used_v2';
const CHALLENGES_KEY = 'match_pairs_challenges_v1';

/** Default number of challenges to play in a row per session. */
export const DEFAULT_CHALLENGES_PER_SESSION = 5;

/** Read the list of already-used word IDs. Returns [] on SSR or any error. */
export function loadUsedIds(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

/** Persist the list of already-used word IDs. Fails silently. */
export function saveUsedIds(ids: string[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage quota exceeded or private mode — fail silently
  }
}

/** Forget every used word so the whole pool can reappear. Fails silently. */
export function clearUsedIds(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

/** Read the chosen number of challenges per session. Falls back to the default. */
export function loadChallengesPerSession(): number {
  try {
    if (typeof window === 'undefined') return DEFAULT_CHALLENGES_PER_SESSION;
    const raw = localStorage.getItem(CHALLENGES_KEY);
    if (!raw) return DEFAULT_CHALLENGES_PER_SESSION;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 ? n : DEFAULT_CHALLENGES_PER_SESSION;
  } catch {
    return DEFAULT_CHALLENGES_PER_SESSION;
  }
}

/** Persist the chosen number of challenges per session. Fails silently. */
export function saveChallengesPerSession(n: number): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CHALLENGES_KEY, String(n));
  } catch {
    // fail silently
  }
}
