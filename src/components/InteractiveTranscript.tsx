"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlayButton, ReplayButton, toSentences, LEVEL_VOICE } from "./Sentence";
import { playNeural, stopNeural } from "@/lib/neuralAudio";

type Props = {
  passage: string;
  level: string;
  voice?: string;
  // Sentence indexes the learner has shadowed, to subtly show progress.
  done?: Set<number>;
  compact?: boolean;
};

/**
 * Professional, sentence-by-sentence transcript. Click any sentence to play
 * exactly that line; the active line is highlighted; ↻ replays it and a
 * repeat mode plays one line continuously for focused shadowing.
 */
export default function InteractiveTranscript({ passage, level, done, compact }: Props) {
  const sentences = useMemo(() => toSentences(passage), [passage]);
  const [active, setActive] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [repeatIndex, setRepeatIndex] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  useEffect(() => () => stopNeural(), []);

  const playSentence = (i: number) => {
    const idx = repeat && repeatIndex === i ? i : i;
    setActive(idx);
    setRepeatIndex(idx);
    stopNeural();
    playNeural(sentences[idx], {
      voice: LEVEL_VOICE,
      level,
      onEnd: () => {
        if (repeat && activeRef.current === idx) {
          // continuous single-line shadow loop, small pause implied by TTS start
          playNeural(sentences[idx], { voice: LEVEL_VOICE, level });
        } else {
          setActive((cur) => (cur === idx ? null : cur));
        }
      },
    });
  };

  const toggleRepeat = () => {
    setRepeat((r) => !r);
    stopNeural();
    setActive(null);
    setRepeatIndex(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <span className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>
          Tap a line to hear it
        </span>
        <button onClick={toggleRepeat}
          className="rounded-full border px-3 py-1 text-[11px] font-bold transition"
          style={{ borderColor: repeat ? "var(--accent-solid)" : "var(--line)", backgroundColor: repeat ? "var(--accent-soft)" : "var(--paper)", color: repeat ? "var(--accent-text)" : "var(--muted)" }}>
          ↻ Repeat mode {repeat ? "on" : "off"}
        </button>
      </div>
      <ol className={compact ? "max-h-[22rem] overflow-y-auto p-2" : "max-h-[26rem] overflow-y-auto p-2"}>
        {sentences.map((s, i) => {
          const isActive = active === i;
          const isDone = done?.has(i);
          return (
            <li key={i}>
              <div
                className="group flex items-start gap-2 rounded-xl px-2.5 py-2 transition"
                style={{ backgroundColor: isActive ? "var(--accent-soft)" : "transparent" }}
              >
                <span className="mt-0.5 w-5 shrink-0 select-none text-right text-[11px] font-semibold tabular-nums"
                  style={{ color: isDone ? "var(--accent-text)" : "var(--muted)", opacity: isDone ? 1 : 0.55 }}>
                  {isDone ? "✓" : i + 1}
                </span>
                <button onClick={() => playSentence(i)} className="min-w-0 flex-1 text-left">
                  <span className="block text-[15px] leading-[1.65] transition"
                    style={{ color: isActive ? "var(--ink)" : "var(--ink)", fontWeight: isActive ? 600 : 400 }}>
                    {s}
                  </span>
                </button>
                <span className="flex shrink-0 items-center gap-1 opacity-90">
                  <PlayButton text={s} level={level} label={`Play sentence ${i + 1}`} />
                  <ReplayButton text={s} level={level} label={`Replay sentence ${i + 1}`} />
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
