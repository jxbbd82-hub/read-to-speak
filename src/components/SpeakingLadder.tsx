"use client";

import { useState } from "react";
import { PlayButton } from "./Sentence";
import SimpleRecorder from "./SimpleRecorder";

type Rung = {
  label: string;
  starter: string;
  seconds: string;
};

type Props = {
  level: string;
  rungs: Rung[];
  onComplete: () => void;
  storageKey: string;
};

/**
 * A five-rung speaking ladder: complete → modify → personalize → respond →
 * free speak. The learner is never asked to invent language from nothing.
 */
export default function SpeakingLadder({ level, rungs, onComplete, storageKey }: Props) {
  const [at, setAt] = useState(0);
  const [recorded, setRecorded] = useState<boolean[]>(rungs.map(() => false));
  const rung = rungs[at];
  const finished = at >= rungs.length;

  const mark = () => {
    const next = [...recorded]; next[at] = true; setRecorded(next);
    if (at === rungs.length - 1) {
      setAt(rungs.length);
      try { localStorage.setItem(`${storageKey}-spoken`, "1"); } catch {}
      onComplete();
    }
  };

  if (finished) {
    return (
      <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--line)", backgroundColor: "var(--accent-soft)" }}>
        <p className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>You completed the speaking ladder.</p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>You went from finishing one line to a full answer.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <div className="flex items-center justify-between">
        <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-white" style={{ backgroundColor: "var(--accent-solid)" }}>
          Step {at + 1}/{rungs.length} · {rung.label}
        </span>
        <span className="text-[12px]" style={{ color: "var(--muted)" }}>{rung.seconds}</span>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed p-3" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
        <PlayButton text={rung.starter} level={level} label="Hear the starter" size="md" />
        <p className="text-[16px] font-medium leading-[1.55]">{rung.starter}<span className="text-[var(--accent-solid)]"> …</span></p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <SimpleRecorder compact label="🎙 Record" onStopped={mark} />
        <div className="flex gap-2">
          <button onClick={() => setAt((i) => Math.max(0, i - 1))} disabled={at === 0}
            className="rounded-full border px-4 py-2 text-[12px] font-bold disabled:opacity-30" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>Back</button>
          <button onClick={() => { const n=[...recorded]; n[at]=true; setRecorded(n); setAt((i) => i + 1); }}
            className="rounded-full px-4 py-2 text-[12px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>
            {at === rungs.length - 1 ? "Free speaking →" : "Next step →"}
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {rungs.map((_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= at ? "var(--accent-solid)" : "var(--line)" }} />
        ))}
      </div>
    </div>
  );
}
