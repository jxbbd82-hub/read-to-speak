"use client";

import { useState } from "react";
import { playNeural, stopNeural } from "@/lib/neuralAudio";

const SPLIT = /(?<=[.!?])\s+(?=[A-Z“"])/;

/** Split a passage into clean, speakable sentences. */
export function toSentences(passage: string): string[] {
  return (passage ?? "")
    .replace(/\s+/g, " ")
    .split(SPLIT)
    .map((s) => s.trim())
    .filter((s) => s && s.split(/\s+/).length >= 2 && s.split(/\s+/).length <= 28);
}

export const LEVEL_VOICE = "andrew"; // one consistent General American male voice

type PlayButtonProps = {
  text: string;
  level?: string;
  label: string;
  size?: "sm" | "md";
  className?: string;
  onEnd?: () => void;
};

/** One-button, one-voice sentence player. Shows while speaking. */
export function PlayButton({ text, level = "B1", label, size = "sm", className = "", onEnd }: PlayButtonProps) {
  const [on, setOn] = useState(false);
  const go = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (on) { stopNeural(); setOn(false); return; }
    stopNeural(); setOn(true);
    playNeural(text, { voice: LEVEL_VOICE, level, onEnd: () => { setOn(false); onEnd?.(); } });
  };
  const dims = size === "md" ? "h-11 w-11" : "h-9 w-9";
  return (
    <button type="button" onClick={go} aria-label={label} title={label}
      className={`grid shrink-0 place-items-center rounded-full border transition active:scale-95 ${dims} ${className}`}
      style={{ borderColor: "var(--line)", color: "var(--accent-text)", backgroundColor: on ? "var(--accent-soft)" : "var(--paper)" }}>
      <span className={on ? "rts-pulse" : ""}>{on ? "■" : "▶"}</span>
    </button>
  );
}

/** Replay (loop) a single sentence N times for shadowing. */
export function ReplayButton({ text, level = "B1", label, className = "" }: { text: string; level?: string; label: string; className?: string }) {
  const [n, setN] = useState(0);
  const play = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setN((x) => x + 1);
    stopNeural();
    playNeural(text, { voice: LEVEL_VOICE, level });
  };
  return (
    <button type="button" onClick={play} aria-label={label} title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition active:scale-95 ${className}`}
      style={{ borderColor: "var(--line)", color: "var(--muted)", backgroundColor: "var(--paper)" }}>
      <span className={n ? "rts-pulse" : ""}>↻</span>
    </button>
  );
}
