"use client";

import { useEffect, useState } from "react";
import SimpleRecorder from "./SimpleRecorder";

type Props = {
  task: string;
  phrases: string[];
  starters: string[];
  ideas: string[];
  personalQuestion: string;
  storageKey: string;
  onDone: () => void;
};

const LENGTHS = [
  { s: 30, label: "30 seconds" },
  { s: 45, label: "45 seconds" },
  { s: 60, label: "60 seconds" },
];

const SELF_CHECKS = [
  "I spoke without translating in my head.",
  "I used phrases from this lesson.",
  "I kept speaking when I forgot a word.",
  "I finished my idea.",
];

export default function SpeakingChallenge({ task, phrases, starters, ideas, personalQuestion, storageKey, onDone }: Props) {
  const [stage, setStage] = useState(0); // 0 prep, 1 30s, 2 45s, 3 60s, 4 review
  const [checks, setChecks] = useState<boolean[]>(SELF_CHECKS.map(() => false));
  const challenge = stage === 0 ? null : LENGTHS[stage - 1];

  if (stage === 0) {
    return (
      <div className="rounded-2xl border-2 p-4" style={{ borderColor: "var(--accent-solid)", backgroundColor: "var(--accent-soft)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>🎤 Speaking challenge · prepare first</p>
        <p className="mt-2 text-[15px] font-semibold leading-snug">{task}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Prep title="Use 3 phrases" items={phrases.slice(0, 3)} />
          <Prep title="2 sentence starters" items={starters.slice(0, 2)} />
          <Prep title="2 ideas you can mention" items={ideas.slice(0, 2)} />
          <Prep title="Make it personal" items={[personalQuestion]} />
        </div>
        <button onClick={() => setStage(1)} className="mt-4 rounded-full px-5 py-2.5 text-[13px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>
          I'm ready · start with 30 seconds →
        </button>
      </div>
    );
  }

  if (stage <= 3 && challenge) {
    return (
      <div className="rounded-2xl border-2 p-4" style={{ borderColor: "var(--accent-solid)", backgroundColor: "var(--accent-soft)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>🎤 Speak for {challenge.label}</p>
          <Timer seconds={challenge.s} />
        </div>
        <p className="mt-2 text-[15px] font-semibold leading-snug">{task}</p>
        <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Hint starters: {starters.slice(0, 2).join("  ·  ")}</p>
        <div className="mt-3"><SimpleRecorder onStopped={() => setStage((s) => s + 1)} label={`🎙 Record ${challenge.label}`} /></div>
        <button onClick={() => setStage((s) => s + 1)} className="mt-2 text-[12px] font-semibold underline" style={{ color: "var(--accent-text)" }}>Skip / next length →</button>
        <div className="mt-3 flex gap-1.5">{LENGTHS.map((_, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i < stage ? "var(--accent-solid)" : "var(--line)" }} />)}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 p-4" style={{ borderColor: "var(--accent-solid)", backgroundColor: "var(--accent-soft)" }}>
      <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>Quick self-check · fluency, not perfection</p>
      <ul className="mt-2 space-y-1.5">
        {SELF_CHECKS.map((c, i) => (
          <li key={c}>
            <button onClick={() => setChecks((x) => x.map((v, j) => (j === i ? !v : v)))} className="flex w-full items-start gap-2 text-left text-[13px]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold"
                style={{ borderColor: "var(--accent-solid)", backgroundColor: checks[i] ? "var(--accent-solid)" : "transparent", color: checks[i] ? "#fff" : "var(--accent-text)" }}>
                {checks[i] ? "✓" : ""}
              </span>
              <span style={{ color: "var(--ink)" }}>{c}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <button onClick={() => { setStage(1); }} className="rounded-full border px-4 py-2 text-[12px] font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>↻ Try again</button>
        <button onClick={() => { try { localStorage.setItem(`${storageKey}-challenge`, "1"); } catch {} onDone(); }}
          className="rounded-full px-5 py-2 text-[12px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>Finish lesson →</button>
      </div>
    </div>
  );
}

function Prep({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-black/10 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[.14em]" style={{ color: "var(--accent-text)" }}>{title}</p>
      <ul className="mt-1 list-disc pl-4 text-[13px] leading-snug" style={{ color: "var(--ink)" }}>
        {items.filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}

function Timer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const id = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return <span className="rounded-full bg-black/10 px-2.5 py-1 text-[12px] font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>0:{String(left).padStart(2, "0")}</span>;
}
