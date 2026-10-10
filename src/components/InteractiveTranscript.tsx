"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TimedSentence } from "@/lib/lessonBuilder";
import type { YouTubePlayerHandle } from "./YouTubePlayer";
import { PlayButton, toSentences } from "./Sentence";

type Props = {
  passage: string;
  level: string;
  voice?: string;
  // Sentence indexes the learner has shadowed, to subtly show progress.
  done?: Set<number>;
  compact?: boolean;
  // Timestamped sentences aligned to the video. When present, the transcript
  // seeks/syncs with the video like Language Reactor.
  timed?: TimedSentence[];
  // Bound YouTube player (used to seek & replay exact sentence segments).
  playerRef?: React.RefObject<YouTubePlayerHandle | null>;
  // Called whenever the video reports its current time (the lesson page
  // forwards this so highlight stays in sync during normal playback).
  currentTime?: number;
  // Timestamps are real caption timing (true) — only then video seek is used.
  synced?: boolean;
};

function findActive(timed: TimedSentence[], time: number): number {
  // Sentences may slightly overlap; choose the last one whose start <= time < end.
  let idx = -1;
  for (let i = 0; i < timed.length; i++) {
    if (time + 0.05 >= timed[i].start && time < timed[i].end + 0.35) { idx = i; }
  }
  // Before the first sentence or in gaps: keep the nearest previous line.
  if (idx === -1) {
    for (let i = timed.length - 1; i >= 0; i--) {
      if (time + 0.05 >= timed[i].start) { idx = i; break; }
    }
  }
  return idx;
}

/**
 * Language-Reactor style transcript:
 *  - complete transcript split into ordered sentences
 *  - click a sentence -> video jumps to its timestamp and plays it
 *  - active sentence auto-highlights in sync with playback
 *  - ↻ replays just that sentence (start..end) without restarting the video
 */
export default function InteractiveTranscript({ passage, level, done, compact, timed, playerRef, currentTime, synced }: Props) {
  const plain = useMemo(() => toSentences(passage), [passage]);
  // Video-synced ONLY with real timestamps (synced=true). Otherwise the
  // transcript falls back to sentence-by-sentence spoken audio (TTS).
  const useVideo = !!synced && !!timed?.length && !!playerRef;
  const lines = useVideo && timed ? timed : plain.map((text) => ({ text, start: 0, end: 0 }));
  const listRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef<number>(-1);
  const [active, setActive] = useState<number>(-1);
  const [repeatIdx, setRepeatIdx] = useState<number>(-1);

  // Highlight based on the video's current time.
  const idxFromTime = useVideo && typeof currentTime === "number" && timed ? findActive(timed, currentTime) : -1;
  useEffect(() => {
    if (!useVideo || typeof currentTime !== "number" || !timed) return;
    const idx = findActive(timed, currentTime);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
    }
  }, [currentTime, timed]);

  // Auto-scroll the active line into view (only when driven by the video).
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-line="${active}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  const seekTo = (i: number) => {
    const line = lines[i];
    if (!line) return;
    setActive(i); activeRef.current = i;
    if (useVideo && typeof line.start === "number") {
      // Real timestamped video: jump and play that segment.
      playerRef.current?.seekTo(line.start, true);
      setRepeatIdx(-1);
    }
  };

  const repeat = (i: number) => {
    const line = lines[i];
    if (!line) return;
    setActive(i); activeRef.current = i;
    if (useVideo && typeof line.start === "number") {
      playerRef.current?.playSegment(line.start, line.end);
      setRepeatIdx(i);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <span className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>
          {useVideo ? "Transcript · tap a line to play it in the video" : "Transcript · tap ▶ to hear each line"}
        </span>
        {repeatIdx >= 0 && (
          <button onClick={() => { setRepeatIdx(-1); }} className="rounded-full border px-3 py-1 text-[11px] font-bold" style={{ borderColor: "var(--accent-solid)", color: "var(--accent-text)" }}>
            ↻ Repeating line {repeatIdx + 1} — stop
          </button>
        )}
      </div>
      <ol ref={listRef} className={compact ? "max-h-[22rem] overflow-y-auto p-2" : "max-h-[26rem] overflow-y-auto p-2"}>
        {lines.map((line, i) => {
          const isActive = active === i;
          const isDone = done?.has(i);
          const hasVideo = useVideo;
          return (
            <li key={i} data-line={i}>
              <div
                className="group flex items-start gap-2 rounded-xl px-2.5 py-2 transition"
                style={{ backgroundColor: isActive ? "var(--accent-soft)" : "transparent" }}
              >
                <span className="mt-0.5 w-6 shrink-0 select-none text-right text-[11px] font-semibold tabular-nums"
                  style={{ color: isDone ? "var(--accent-text)" : "var(--muted)", opacity: isDone ? 1 : 0.6 }}>
                  {isDone ? "✓" : i + 1}
                </span>
                <button onClick={() => seekTo(i)} className="min-w-0 flex-1 text-left">
                  <span className="block text-[15px] leading-[1.65] transition" style={{ fontWeight: isActive ? 600 : 400 }}>
                    {line.text}
                  </span>
                  {useVideo && (
                    <span className="mt-0.5 block text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                      {formatTime(line.start)}
                    </span>
                  )}
                </button>
                <span className="flex shrink-0 items-center gap-1">
                  {hasVideo ? (
                    <>
                      <button onClick={() => seekTo(i)} aria-label={`Play sentence ${i + 1} in the video`} title="Play this sentence in the video"
                        className="grid h-9 w-9 place-items-center rounded-full border transition active:scale-95"
                        style={{ borderColor: "var(--line)", color: "var(--accent-text)", backgroundColor: isActive ? "var(--accent-soft)" : "var(--paper)" }}>▶</button>
                      <button onClick={() => repeat(i)} aria-label={`Repeat sentence ${i + 1}`} title="Repeat this sentence"
                        className="grid h-9 w-9 place-items-center rounded-full border transition active:scale-95"
                        style={{ borderColor: repeatIdx === i ? "var(--accent-solid)" : "var(--line)", color: "var(--accent-text)", backgroundColor: "var(--paper)" }}>↻</button>
                    </>
                  ) : (
                    <PlayButton text={line.text} level={level} label={`Play sentence ${i + 1}`} />
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
