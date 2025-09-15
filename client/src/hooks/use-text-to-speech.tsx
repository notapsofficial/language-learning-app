import { useState, useCallback, useEffect } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface TextToSpeechResult {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  error: string | null;
}

export function useTextToSpeech({
  language = 'en-US',
  rate = 1,
  pitch = 1,
  volume = 1,
}: UseTextToSpeechOptions = {}): TextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Check if Speech Synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) {
      setError('Text-to-speech is not supported in this browser');
      return;
    }

    setSynthesis(window.speechSynthesis);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!synthesis || !text.trim()) return;

    // Cancel any ongoing speech
    synthesis.cancel();

    const newUtterance = new SpeechSynthesisUtterance(text);
    newUtterance.lang = language;
    newUtterance.rate = rate;
    newUtterance.pitch = pitch;
    newUtterance.volume = volume;

    newUtterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
    };

    newUtterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    newUtterance.onerror = (event) => {
      setError(`Text-to-speech error: ${event.error}`);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    newUtterance.onpause = () => {
      setIsPaused(true);
    };

    newUtterance.onresume = () => {
      setIsPaused(false);
    };

    setUtterance(newUtterance);
    synthesis.speak(newUtterance);
  }, [synthesis, language, rate, pitch, volume]);

  const stop = useCallback(() => {
    if (synthesis) {
      synthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [synthesis]);

  const pause = useCallback(() => {
    if (synthesis && isSpeaking && !isPaused) {
      synthesis.pause();
    }
  }, [synthesis, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (synthesis && isPaused) {
      synthesis.resume();
    }
  }, [synthesis, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthesis) {
        synthesis.cancel();
      }
    };
  }, [synthesis]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    error,
  };
}
