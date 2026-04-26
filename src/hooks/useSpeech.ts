import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSpeech — plays pre-generated ElevenLabs MP3s served from /audio/tts/.
 *
 * Audio files are generated offline by `scripts/generate-tts.ts` and committed
 * to the repo. At runtime we just compute the SHA1 of `${voiceId}|${text}` and
 * play the matching file — no API calls, no costs, works offline.
 *
 * Falls back to the browser's built-in SpeechSynthesis if a file is missing
 * (e.g. a phrase added after the last generation run).
 */

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah

// SHA1 in the browser via Web Crypto. Returns a hex string.
async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Keep resolved URLs around so we don't hash the same phrase twice.
const urlCache = new Map<string, string>();

async function resolveUrl(text: string, voiceId: string) {
  const key = `${voiceId}|${text}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const id = await sha1Hex(key);
  const url = `/audio/tts/${id}.mp3`;
  urlCache.set(key, url);
  return url;
}

export function useSpeech(defaultLang = "en-US") {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

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
      },
    ) => {
      if (!text) return;
      stop();

      const voiceId = opts?.voiceId ?? DEFAULT_VOICE_ID;

      try {
        const url = await resolveUrl(text, voiceId);
        // HEAD check so we can fall back gracefully if the file isn't bundled.
        const head = await fetch(url, { method: "HEAD" });
        if (!head.ok) throw new Error(`Audio not found (${head.status})`);

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
          speakFallback(text, opts);
        };
        await audio.play();
      } catch (err) {
        console.warn("[useSpeech] using browser fallback:", err);
        speakFallback(text, opts);
      }
    },
    [stop, speakFallback],
  );

  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, speak, stop };
}
