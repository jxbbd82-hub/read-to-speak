"use client";

// Same General American neural voices used for all on-demand playback.
// Fetches an MP3 from the server TTS route and manages one audio element.

type PlayOptions = {
  voice?: "ava" | "andrew" | "emma";
  level?: string;
  rate?: number;
  onEnd?: () => void;
  onTime?: (current: number, duration: number) => void;
};

let el: HTMLAudioElement | null = null;
const cache = new Map<string, string>();
let activeKey = "";

export function stopNeural() {
  el?.pause();
}

function browserFallback(text: string, opts: PlayOptions) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts.rate ?? 1;
  const en = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("en-us"));
  if (en) u.voice = en;
  u.onend = () => opts.onEnd?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export async function playNeural(text: string, opts: PlayOptions = {}): Promise<void> {
  if (!text.trim()) return;
  stopNeural();
  const voice = opts.voice ?? "ava";
  const key = `${voice}|${opts.level ?? "B1"}|${text}`;
  let url = cache.get(key);
  if (!url) {
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, level: opts.level }),
      });
      if (!r.ok) return browserFallback(text, opts);
      const blob = await r.blob();
      url = URL.createObjectURL(blob);
      if (cache.size > 80) cache.delete(cache.keys().next().value as string);
      cache.set(key, url);
    } catch {
      return browserFallback(text, opts);
    }
  }
  activeKey = key;
  if (!el) el = new Audio();
  el.src = url;
  el.playbackRate = opts.rate ?? 1;
  el.onended = () => opts.onEnd?.();
  el.ontimeupdate = () => opts.onTime?.(el!.currentTime, el!.duration || 0);
  el.onerror = () => browserFallback(text, opts);
  await el.play().catch(() => browserFallback(text, opts));
}

export function setNeuralRate(rate: number) {
  if (el) el.playbackRate = rate;
}

export function currentKey() {
  return activeKey;
}
