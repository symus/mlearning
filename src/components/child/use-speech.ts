"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Narration with the browser's built-in speech engine (works offline, no audio files needed). */
export function useSpeech(lang = "en-GB") {
  // false on the server, real value in the browser (no hydration mismatch).
  const supported = useSyncExternalStore(noopSubscribe, () => "speechSynthesis" in window, () => false);
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.9;
      u.pitch = 1.1;
      const voice = synth.getVoices().find((v) => v.lang === lang) ?? synth.getVoices().find((v) => v.lang.startsWith("en"));
      if (voice) u.voice = voice;
      synth.speak(u);
    },
    [supported, lang],
  );
  return { speak, supported };
}
