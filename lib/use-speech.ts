'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/* =============================================
   useSpeech — robust speech-to-text hook
   - Live interim transcript while speaking
   - Mapped, human-readable error messages
   - Safe start/stop lifecycle (no dangling recognizers)
   ============================================= */

export interface UseSpeechResult {
  supported: boolean;
  listening: boolean;
  /** Words recognized so far in the current utterance (not yet final) */
  interim: string;
  /** Friendly error message; auto-clears after a few seconds */
  error: string | null;
  toggle: () => void;
  stop: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow mic permission for this site and try again.',
  'service-not-allowed': 'Microphone access is blocked. Allow mic permission for this site and try again.',
  'audio-capture': 'No microphone found on this device.',
  'no-speech': "Didn't catch that — try speaking again, a little closer to the mic.",
  'network': 'Voice service unavailable — check your internet connection.',
  'aborted': '',
  'language-not-supported': 'Voice input is not supported for this language on your browser.',
};

export function useSpeech(onFinal: (text: string) => void): UseSpeechResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const onFinalRef = useRef(onFinal);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  onFinalRef.current = onFinal;

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
    return () => {
      try { recRef.current?.abort?.(); } catch { /* ignore */ }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const showError = useCallback((code: string) => {
    const msg = ERROR_MESSAGES[code] ?? 'Voice input failed — please type instead.';
    if (!msg) return; // intentional aborts are silent
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setError(null);

    const rec = new SR();
    rec.lang = 'en-IN'; // handles English + Hinglish reasonably
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          if (chunk.trim()) onFinalRef.current(chunk.trim());
        } else {
          interimText += chunk;
        }
      }
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      showError(e?.error || 'unknown');
      setListening(false);
      setInterim('');
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() throws if a session is already active — reset and let the user retry
      setListening(false);
    }
  }, [showError]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, toggle, stop };
}
