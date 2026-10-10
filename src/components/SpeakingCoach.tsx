"use client";

import { useMemo, useState } from "react";
import SimpleRecorder from "./SimpleRecorder";
import { PlayButton } from "./Sentence";

type Props = {
  level: string;
  passage: string;
  // Lesson shadow lines (real sentences) for repeat/modify stages.
  shadows: string[];
  chunks: { word: string }[];
  questions: string[];
  frames: string[];
};

type Stage = { id: number; title: string; hint: string };

const STAGES: Stage[] = [
  { id: 1, title: "1 · Repeat & recall", hint: "Listen, say it aloud, then try from memory." },
  { id: 2, title: "2 · Make it yours", hint: "Change one detail so the sentence becomes about you." },
  { id: 3, title: "3 · Build your answer", hint: "Use the starter. Take it in small steps." },
  { id: 4, title: "4 · Speak independently", hint: "Answer in your own words. Short is fine — keep going." },
  { id: 5, title: "5 · Check & repeat", hint: "Compare with a natural version, then say it again." },
];

function pick(passage: string, count: number, maxWords = 16): string[] {
  return passage
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      const w = s.split(/\s+/).length;
      return w >= 4 && w <= maxWords;
    })
    .slice(0, count);
}

/**
 * Five-stage progressive speaking coach. B1-understanding / A2-speaking:
 * short answers welcomed, sentence starters and a natural model provided,
 * assistance reduced as the learner advances.
 */
export default function SpeakingCoach({ level, passage, shadows, chunks, questions, frames }: Props) {
  const sentences = useMemo(() => {
    const fromShadow = shadows.filter((s) => s.split(/\s+/).length <= 18);
    const fromPassage = pick(passage, 8);
    const merged = [...fromShadow, ...fromPassage];
    return Array.from(new Set(merged)).slice(0, 8);
  }, [passage, shadows]);

  const question = questions[0] ?? "Tell me what happened in your own words.";
  const starter = frames[0] ?? "The main idea is…";
  const useful = chunks.slice(0, 5).map((c) => c.word);
  const natural = useMemo(() => {
    // A natural model answer built from the lesson's own language.
    const bits = useful.slice(0, 3).join(", ");
    return `${starter.replace("…", "").trim()} ${question.replace(/^(Retell|Describe|Explain|Tell|How|What|Who|Why|Give|Imagine|Use)\b[^.?!]*[.?!]?/i, "").trim() || "In this scene, people talk naturally about what matters."} I could use ${bits || "short, clear sentences"} in my answer.`;
  }, [starter, question, useful]);

  const [stage, setStage] = useState(1);
  const [showModel, setShowModel] = useState(false);
  const [modifyIdea, setModifyIdea] = useState<string | null>(null);
  const idx = (stage - 1) % Math.max(1, sentences.length);
  const line = sentences[idx] ?? passage.split(/(?<=[.!?])\s+/)[0];

  const next = () => { setShowModel(false); setStage((s) => Math.min(5, s + 1)); };
  const back = () => setStage((s) => Math.max(1, s - 1));

  return (
    <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      {/* stage tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((s) => (
          <button key={s.id} onClick={() => setStage(s.id)}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold transition"
            style={{
              backgroundColor: stage === s.id ? "var(--accent-solid)" : "var(--paper)",
              color: stage === s.id ? "#fff" : "var(--muted)",
              border: `1px solid ${stage === s.id ? "var(--accent-solid)" : "var(--line)"}`,
            }}>
            {s.id}
          </button>
        ))}
      </div>
      <p className="mt-3 font-display text-lg font-semibold">{STAGES[stage - 1].title}</p>
      <p className="mt-0.5 text-[13px]" style={{ color: "var(--muted)" }}>{STAGES[stage - 1].hint}</p>

      <div className="mt-4 space-y-4">
        {stage === 1 && (
          <div>
            {line && (
              <div className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: "var(--paper)" }}>
                <PlayButton text={line} level={level} size="md" label="Play the sentence" />
                <div>
                  <p className="text-[15px] font-medium leading-snug">“{line}”</p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Play it, repeat aloud twice, then press record and say it without reading.</p>
                </div>
              </div>
            )}
            <div className="mt-3"><SimpleRecorder /></div>
          </div>
        )}

        {stage === 2 && (
          <div>
            <div className="rounded-xl p-3" style={{ backgroundColor: "var(--paper)" }}>
              <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--accent-text)" }}>Original sentence</p>
              <p className="mt-1 text-[15px]">“{line}”</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Change the place", "Change how you felt", "Make it about your work", "Make it about today"].map((idea) => (
                <button key={idea} onClick={() => setModifyIdea(idea)}
                  className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
                  style={{ borderColor: modifyIdea === idea ? "var(--accent-solid)" : "var(--line)", backgroundColor: modifyIdea === idea ? "var(--accent-soft)" : "var(--card)", color: "var(--ink)" }}>
                  {idea}
                </button>
              ))}
            </div>
            {modifyIdea && (
              <>
                <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>{modifyIdea}, then say your new sentence. Keep the grammar of the original.</p>
                <div className="mt-2"><SimpleRecorder /></div>
              </>
            )}
          </div>
        )}

        {stage === 3 && (
          <div>
            <p className="text-[15px] font-semibold">{question}</p>
            <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>Start your answer with:</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {frames.slice(0, 3).map((f) => (
                <span key={f} className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-text)" }}>{f}</span>
              ))}
            </div>
            {useful.length > 0 && (
              <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>Useful from this lesson: <strong style={{ color: "var(--ink)" }}>{useful.join(" · ")}</strong></p>
            )}
            <div className="mt-2"><SimpleRecorder /></div>
          </div>
        )}

        {stage === 4 && (
          <div>
            <p className="text-[15px] font-semibold">{question}</p>
            <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>No starters this time. Begin with one or two sentences — a short answer is completely okay. Record it.</p>
            <div className="mt-2"><SimpleRecorder /></div>
          </div>
        )}

        {stage === 5 && (
          <div>
            <button onClick={() => setShowModel((v) => !v)} className="rounded-full border px-4 py-2 text-[13px] font-bold" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }}>
              {showModel ? "Hide natural version" : "Show a natural version"}
            </button>
            {showModel && (
              <div className="mt-3 rounded-xl border-l-4 p-3 text-[14px] leading-relaxed" style={{ borderLeftColor: "var(--accent-solid)", backgroundColor: "var(--accent-soft)" }}>
                “{natural}”
              </div>
            )}
            <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>Notice one thing to improve, then say the answer again without reading the model.</p>
            <div className="mt-2"><SimpleRecorder /></div>
          </div>
        )}
      </div>

      {/* navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={back} disabled={stage === 1} className="rounded-full px-4 py-2 text-[13px] font-semibold disabled:opacity-30" style={{ color: "var(--muted)" }}>← Back</button>
        <span className="text-[12px]" style={{ color: "var(--muted)" }}>Stage {stage} / 5</span>
        {stage < 5 ? (
          <button onClick={next} className="rounded-full px-5 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>Next →</button>
        ) : (
          <button onClick={() => setStage(1)} className="rounded-full px-5 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>Practice again</button>
        )}
      </div>
    </section>
  );
}
