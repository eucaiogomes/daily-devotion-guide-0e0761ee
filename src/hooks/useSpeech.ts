import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSpeech — text-to-speech with ElevenLabs (humanized) and Web Speech API fallback.
 *
 * Uses the /api/tts server endpoint backed by ElevenLabs for natural, expressive voices.
 * Falls back to the browser's built-in SpeechSynthesis if the API call fails or is offline.
 */

// Cache audio blobs per (voiceId|text) so repeated taps are instant and don't re-bill.
const audioCache = new Map<string, string>();

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah

export function useSpeech(defaultLang = "en-US") {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Pick the best fallback voice once available.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const lang = defaultLang.toLowerCase();
      const score = (v: SpeechSynthesisVoice) => {
        let s = 0;
        const vl = v.lang?.toLowerCase() ?? "";
        if (vl === lang) s += 10;
        else if (vl.startsWith(lang.split("-")[0])) s += 5;
        const name = v.name.toLowerCase();
        if (/natural|neural|premium|enhanced/.test(name)) s += 6;
        if (/google/.test(name)) s += 4;
        if (/samantha|aaron|karen|daniel/.test(name)) s += 3;
        if (v.localService) s += 1;
        return s;
      };
      fallbackVoiceRef.current =
        [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [defaultLang]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speakFallback = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts?.lang ?? defaultLang;
      u.rate = opts?.rate ?? 0.9;
      u.pitch = opts?.pitch ?? 1;
      if (fallbackVoiceRef.current) u.voice = fallbackVoiceRef.current;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [defaultLang],
  );

  const speak = useCallback(
    async (
      text: string,
      opts?: {
        rate?: number;
        pitch?: number;
        lang?: string;
        voiceId?: string;
        modelId?: string;
      },
    ) => {
      if (!text) return;
      stop();

      const voiceId = opts?.voiceId ?? DEFAULT_VOICE_ID;
      const cacheKey = `${voiceId}|${text}`;

      try {
        let url = audioCache.get(cacheKey);
        if (!url) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              voiceId,
              modelId: opts?.modelId,
            }),
          });
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          audioCache.set(cacheKey, url);
        }

        const audio = new Audio(url);
        audio.playbackRate = opts?.rate ?? 1;
        audioRef.current = audio;
        audio.onplay = () => setSpeaking(true);
        audio.onended = () => {
          setSpeaking(false);
          if (audioRef.current === audio) audioRef.current = null;
        };
        audio.onerror = () => {
          setSpeaking(false);
          // If playback fails, try the browser fallback.
          speakFallback(text, opts);
        };
        await audio.play();
      } catch (err) {
        // Network error / API failure → use the browser's native voice.
        console.warn("[useSpeech] ElevenLabs failed, falling back:", err);
        speakFallback(text, opts);
      }
    },
    [stop, speakFallback],
  );

  // Stop on unmount to avoid speech leaking across pages.
  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, speak, stop };
}
