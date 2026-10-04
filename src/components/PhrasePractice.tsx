"use client";

import { useState } from "react";
import type { VocabItem } from "@/data/courses";
import { PlayButton } from "./Sentence";
import SimpleRecorder from "./SimpleRecorder";
import YouGlishButton from "./YouGlishButton";

type Props = {
  chunks: VocabItem[];
  level: string;
  context: "client" | "everyday";
  marks: Record<string, number>;
  setMark: (word: string, value: number) => void;
  practiced: Record<string, boolean>;
  setPracticed: (word: string, v: boolean) => void;
};

const CLIENT_PROMPT = "Use this phrase to reply to a client.";
const LIFE_PROMPT = "Use this phrase in a sentence about your day or your work.";

export default function PhrasePractice({ chunks, level, context, marks, setMark, practiced, setPracticed }: Props) {
  const [open, setOpen] = useState(0);
  const [answer, setAnswer] = useState("");
  const [said, setSaid] = useState(false);
  const total = chunks.length;
  const practicedCount = chunks.filter((c) => practiced[c.word]).length;
  const chunk = chunks[Math.min(open, total - 1)];
  if (!chunk) return null;

  const next = () => {
    setPracticed(chunk.word, true);
    setMark(chunk.word, Math.max(marks[chunk.word] ?? 0, said || answer.trim() ? 2 : 1));
    setAnswer(""); setSaid(false);
    setOpen((i) => Math.min(i + 1, total - 1));
  };

  return (
    <div className="rounded-2xl border" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--line)" }}>
        <span className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>
          {practicedCount}/{total} practiced
        </span>
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>{context === "client" ? "Client English" : "Everyday English"}</span>
      </div>

      <ol className="flex flex-wrap gap-1.5 p-3">
        {chunks.map((c, i) => {
          const isPracticed = practiced[c.word];
          return (
            <li key={c.word}>
              <button onClick={() => { setOpen(i); setAnswer(""); setSaid(false); }}
                className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition"
                style={{
                  borderColor: i === open ? "var(--accent-solid)" : "var(--line)",
                  backgroundColor: i === open ? "var(--accent-soft)" : isPracticed ? "var(--accent-soft)" : "var(--paper)",
                  color: i === open ? "var(--accent-text)" : isPracticed ? "var(--accent-text)" : "var(--muted)",
                }}>
                {isPracticed ? "✓ " : ""}{c.word.length > 22 ? c.word.slice(0, 21) + "…" : c.word}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
        <div className="flex items-start gap-3">
          <PlayButton text={`${chunk.word}. ${chunk.example}`} level={level} label="Listen to the phrase" size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-semibold leading-snug">{chunk.word}</p>
              <YouGlishButton phrase={chunk.word} />
            </div>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--muted)" }}>{chunk.meaning}</p>
            <p className="mt-1 text-[14px] italic" style={{ color: "var(--muted)" }}>“{chunk.example}”</p>
          </div>
        </div>

        {/* controlled production */}
        <div className="mt-4 rounded-xl border border-dashed p-3" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
          <p className="text-[12px] font-bold uppercase tracking-[.14em]" style={{ color: "var(--accent-text)" }}>Now you · {context === "client" ? CLIENT_PROMPT : LIFE_PROMPT}</p>
          <div className="mt-2 flex items-center gap-2">
            <SimpleRecorder
              onStopped={() => setSaid(true)}
              accentColor="var(--accent-solid)"
              label="Record your sentence"
            />
            {said && <span className="text-[12px] font-semibold text-[#46b78c]">Recorded ✓</span>}
          </div>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2}
            placeholder={`Start with: ${chunk.word}…`}
            className="mt-2 w-full rounded-xl border p-2.5 text-sm outline-none"
            style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
        </div>

        <div className="mt-3 flex justify-end">
          <button onClick={next} disabled={open >= total - 1 && practiced[chunk.word]}
            className="rounded-full px-5 py-2 text-[13px] font-bold text-white transition disabled:opacity-40"
            style={{ backgroundColor: "var(--accent-solid)" }}>
            {open >= total - 1 ? "Phrase done ✓" : "Next phrase →"}
          </button>
        </div>
      </div>
    </div>
  );
}
