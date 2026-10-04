"use client";

import { useState } from "react";
import { PlayButton } from "./Sentence";
import SimpleRecorder from "./SimpleRecorder";

type Props = {
  prompt: string;
  level: string;
  stems: string[]; // progressively longer sentence builders
  storageKey: string;
};

/**
 * "Build Your Answer" — the bridge from controlled practice to free speech.
 * The learner expands one answer step by step, then says the complete idea
 * without looking.
 */
export default function BuildAnswer({ prompt, level, stems, storageKey }: Props) {
  const [step, setStep] = useState(0);
  const [said, setSaid] = useState(false);

  const current = stems[Math.min(step, stems.length - 1)];
  const done = step >= stems.length;

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <p className="text-[14px] font-semibold leading-snug">{prompt}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {stems.map((_, i) => (
          <button key={i} onClick={() => { setStep(i); setSaid(false); }}
            className="h-2 w-7 rounded-full transition"
            style={{ backgroundColor: i <= step ? "var(--accent-solid)" : "var(--line)" }} aria-label={`Step ${i + 1}`} />
        ))}
      </div>

      {!done ? (
        <div className="mt-3 rounded-xl border border-dashed p-3" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
          <div className="flex items-start gap-2">
            <PlayButton text={current} level={level} label="Hear the starter" size="md" />
            <p className="text-[16px] font-medium leading-[1.55]">{current}<span className="text-[var(--accent-solid)]"> …</span></p>
          </div>
          <p className="mt-2 text-[12px]" style={{ color: "var(--muted)" }}>Say the sentence and finish it in your own words.</p>
          <div className="mt-2 flex items-center gap-2">
            <SimpleRecorder compact onStopped={() => setSaid(true)} label="🎙 Say it" />
            {said && <span className="text-[12px] font-semibold text-[#46b78c]">Good ✓</span>}
            <button onClick={() => setStep((s) => s + 1)} disabled={!said}
              className="ml-auto rounded-full px-4 py-2 text-[12px] font-bold text-white transition disabled:opacity-35"
              style={{ backgroundColor: "var(--accent-solid)" }}>
              Add more →
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: "var(--accent-soft)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--accent-text)" }}>Now say the complete answer without looking.</p>
          <div className="mt-2"><SimpleRecorder onStopped={() => { try { localStorage.setItem(storageKey, "done"); } catch {} }} label="🎙 Record full answer" /></div>
          <button onClick={() => { setStep(0); setSaid(false); }} className="mt-2 text-[12px] font-semibold underline" style={{ color: "var(--accent-text)" }}>Practice again</button>
        </div>
      )}
    </div>
  );
}
