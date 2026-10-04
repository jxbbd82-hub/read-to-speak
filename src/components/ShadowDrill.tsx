"use client";

import { useState } from "react";
import { PlayButton } from "./Sentence";

type Stage = "listen" | "shadow" | "blind";
const STEPS: { key: Stage; label: string }[] = [
  { key: "listen", label: "Listen" },
  { key: "shadow", label: "Shadow" },
  { key: "blind", label: "Repeat without looking" },
];

export default function ShadowDrill({ lines, level, onProgress }: { lines: string[]; level: string; onProgress?: (doneCount: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("listen");
  const [done, setDone] = useState<Set<number>>(new Set());
  const [blind, setBlind] = useState(false);

  if (!lines.length) return null;
  const line = lines[Math.min(idx, lines.length - 1)];
  const stageIndex = STEPS.findIndex((s) => s.key === stage);

  const markStage = (next: Stage) => {
    if (next === "blind") setBlind(true);
    if (next === "listen" && stage === "blind") {
      // completed full cycle for this line → advance
      const d = new Set(done); d.add(idx); setDone(d);
      onProgress?.(d.size);
      setBlind(false);
      setStage("listen");
      setIdx((i) => Math.min(i + 1, lines.length - 1));
      return;
    }
    setStage(next);
  };

  const reset = () => { setBlind(false); setStage("listen"); };

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      {/* progress */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {lines.map((_, i) => (
            <span key={i} className="h-1.5 w-5 rounded-full transition"
              style={{ backgroundColor: done.has(i) || i < idx ? "var(--accent-solid)" : "var(--line)" }} />
          ))}
        </div>
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--muted)" }}>{Math.min(idx + 1, lines.length)}/{lines.length}</span>
      </div>

      {/* line card */}
      <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
        <div className="flex items-start gap-3">
          <PlayButton text={line} level={level} label="Listen to this line" size="md" />
          <p className={`text-[17px] font-medium leading-[1.55] transition ${blind ? "select-none text-transparent" : ""}`}
            style={blind ? { textShadow: "0 0 10px rgba(255,255,255,.55)", color: "var(--muted)" } : undefined}>
            {blind ? "Say it without looking…" : line}
          </p>
        </div>

        {/* stage stepper */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => {
            const active = i === stageIndex;
            const passed = i < stageIndex;
            return (
              <button key={s.key} onClick={() => { setStage(s.key); if (s.key !== "blind") setBlind(false); else setBlind(true); }}
                className="rounded-full border px-3 py-1.5 text-[12px] font-bold transition"
                style={{
                  borderColor: active ? "var(--accent-solid)" : "var(--line)",
                  backgroundColor: active ? "var(--accent-solid)" : passed ? "var(--accent-soft)" : "var(--card)",
                  color: active ? "#fff" : passed ? "var(--accent-text)" : "var(--muted)",
                }}>
                {i + 1}. {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={reset} className="text-[12px] font-semibold underline" style={{ color: "var(--muted)" }}>↻ Repeat this line</button>
          <div className="flex gap-2">
            <button onClick={() => { reset(); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}
              className="rounded-full border px-4 py-2 text-[12px] font-bold disabled:opacity-30" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>Back</button>
            {stage !== "blind" ? (
              <button onClick={() => markStage(STEPS[stageIndex + 1]?.key ?? "blind")} className="rounded-full px-4 py-2 text-[12px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>
                {stage === "listen" ? "I shadowed it →" : "Hide & repeat →"}
              </button>
            ) : (
              <button onClick={() => markStage("listen")} className="rounded-full px-4 py-2 text-[12px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>
                {idx >= lines.length - 1 ? "Done ✓" : "Next line →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
