'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, Loader2, VolumeX } from 'lucide-react';

type Props = {
  /** Text to be spoken aloud (used for the sentence proxy + accessibility). */
  text: string;
  /**
   * Optional pre-resolved audio file (e.g. a real native-speaker recording).
   * When provided it is tried first, before the server TTS proxy.
   */
  audioUrl?: string;
  /** BCP-47 language tag. Defaults to American English. */
  lang?: string;
  /** Speaking rate for the Web Speech fallback (0.1 - 10). */
  rate?: number;
  /** Visual size of the button. */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label; falls back to a generic English label. */
  label?: string;
};

type Status = 'idle' | 'loading' | 'playing' | 'error';

const SIZE_MAP = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14', icon: 'h-7 w-7' },
} as const;

/**
 * Accessible "listen" button.
 *
 * Audio is resolved through a layered fallback so it works on any device,
 * including Linux browsers that ship without Web Speech voices:
 *   1. `audioUrl` (real recording) — when provided
 *   2. `/api/tts` server proxy — works for arbitrary text (sentences)
 *   3. Web Speech API — only if the OS has voices installed (offline fallback)
 */
export default function PronounceButton({
  text,
  audioUrl,
  lang = 'en-US',
  rate = 0.9,
  size = 'md',
  label,
}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up any in-flight audio / speech when unmounting.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /** Try to play a media URL. Resolves true once playback actually starts. */
  const playUrl = useCallback((src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.pause();
      audio.src = src;
      audio.onended = () => setStatus('idle');
      audio.onerror = () => resolve(false);
      audio
        .play()
        .then(() => {
          setStatus('playing');
          resolve(true);
        })
        .catch(() => resolve(false));
    });
  }, []);

  /** Last-resort fallback using the browser's speech synthesis (needs OS voices). */
  const speakViaSynthesis = useCallback((): Promise<boolean> => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve(false);
    }
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    // No usable voice installed → report failure so the UI can show an error.
    if (!voice) return Promise.resolve(false);

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.onstart = () => setStatus('playing');
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => resolve(false);
      synth.cancel();
      synth.speak(utterance);
      resolve(true);
    });
  }, [text, lang, rate]);

  const handleClick = useCallback(async () => {
    setStatus('loading');

    const proxyUrl = `/api/tts?q=${encodeURIComponent(text)}&lang=${lang.slice(0, 2)}`;
    const sources = audioUrl ? [audioUrl, proxyUrl] : [proxyUrl];

    for (const src of sources) {
      if (await playUrl(src)) return;
    }

    if (await speakViaSynthesis()) return;

    setStatus('error');
  }, [text, audioUrl, lang, playUrl, speakViaSynthesis]);

  const sizes = SIZE_MAP[size];
  const baseLabel = label ?? `Listen to the pronunciation of ${text}`;
  const ariaLabel = status === 'error' ? `${baseLabel} (audio unavailable)` : baseLabel;

  const stateClasses =
    status === 'error'
      ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300'
      : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'loading'}
      title={status === 'error' ? 'Não foi possível reproduzir o áudio' : baseLabel}
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border transition-all active:scale-95 disabled:cursor-wait ${stateClasses} ${sizes.box} ${
        status === 'playing' ? 'ring-2 ring-indigo-400/60' : ''
      }`}
    >
      {status === 'loading' ? (
        <Loader2 className={`${sizes.icon} animate-spin`} />
      ) : status === 'error' ? (
        <VolumeX className={sizes.icon} />
      ) : (
        <Volume2 className={`${sizes.icon} ${status === 'playing' ? 'animate-pulse' : ''}`} />
      )}
    </button>
  );
}
