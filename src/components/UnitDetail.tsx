"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LearningItem, VocabItem } from "@/data/courses";
import { accents, type Accent, type ProgressEntry } from "@/lib/accents";
import { playNeural, stopNeural } from "@/lib/neuralAudio";
import { PlayButton, toSentences, LEVEL_VOICE } from "./Sentence";
import InteractiveTranscript from "./InteractiveTranscript";
import ShadowDrill from "./ShadowDrill";
import PhrasePractice from "./PhrasePractice";
import BuildAnswer from "./BuildAnswer";
import SpeakingLadder from "./SpeakingLadder";
import SpeakingChallenge from "./SpeakingChallenge";
import SimpleRecorder from "./SimpleRecorder";
import { buildLadder, buildStems, thinkTasks, challengePrep, isClientContext } from "@/lib/speaking";

const UNLOCK_LISTENS = 1;

type Segment = {
  title: string; author: string; start: number; passage: string;
  chunks: VocabItem[]; shadows: string[]; questions: string[];
  frames: string[]; writingPrompt: string; thinkPrompts: string[]; wordCount: number;
  challenge?: string;
};

export type LessonSource = {
  fetchUrl: string;
  cacheKey: string;
  pasteUrl?: string;
  badge: string;
  backLabel: string;
  levelLabel: string;
  videoStart?: number;
  topic?: string;
};

/* Writing that serves speaking: write → read out loud → say without looking → rephrase */
function WriteToSpeak({ storageKey, prompt, model, accent, level }: { storageKey: string; prompt: string; model: string; accent: Accent; level: string }) {
  const [tab, setTab] = useState<"write" | "dictation">("write");
  const [text, setText] = useState("");
  const [dict, setDict] = useState("");
  const [read, setRead] = useState(false);
  const [blind, setBlind] = useState(false);
  useEffect(() => {
    setText(localStorage.getItem(`${storageKey}-w`) ?? "");
    setDict(localStorage.getItem(`${storageKey}-d`) ?? "");
  }, [storageKey]);
  const target = { A1: 30, A2: 40, B1: 45, B2: 60, C1: 75, C2: 90 }[level] ?? 45;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s']/g, " ").replace(/\s+/g, " ").trim();
  const dictTarget = useMemo(() => toSentences(model).filter((s) => s.split(/\s+/).length <= 12)[0] ?? model, [model]);
  const match = dict && norm(dict) === norm(dictTarget);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <div className="flex gap-2">
        {([["write", "Write & speak"], ["dictation", "Dictation"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="rounded-full px-3 py-1.5 text-[12px] font-bold"
            style={{ backgroundColor: tab === k ? accent.solid : "var(--paper)", color: tab === k ? "#fff" : "var(--muted)" }}>{l}</button>
        ))}
      </div>

      {tab === "write" ? (
        <>
          <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>{prompt}</p>
          <textarea value={text} onChange={(e) => { setText(e.target.value); try { localStorage.setItem(`${storageKey}-w`, e.target.value); } catch {} }}
            rows={5} placeholder="5–6 short sentences…"
            className="mt-2 w-full rounded-xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>{text.trim() ? text.trim().split(/\s+/).length : 0} / {target} words</p>
          <div className="mt-3 space-y-2">
            <StepRow done={read} onClick={() => { setRead(true); stopNeural(); playNeural(text || model, { voice: LEVEL_VOICE, level }); }} n={1} label="Read it out loud" accent={accent} />
            <StepRow done={blind} onClick={() => setBlind(true)} n={2} label="Say it without looking" accent={accent} />
            <StepRow done={false} onClick={() => {}} n={3} label="Say it again using different words" accent={accent} recorder />
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2">
            <PlayButton text={dictTarget} level={level} label="Play dictation" size="md" />
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>Listen · type · then say it.</span>
          </div>
          <textarea value={dict} onChange={(e) => { setDict(e.target.value); try { localStorage.setItem(`${storageKey}-d`, e.target.value); } catch {} }}
            rows={3} className="mt-2 w-full rounded-xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          {dict && <p className="mt-2 text-[13px] font-semibold" style={{ color: match ? "#46b78c" : "#e0a368" }}>{match ? "✓ Matched — now say it out loud" : "Compare, then say it:"}</p>}
          {dict && !match && <p className="mt-1 rounded-xl p-2.5 text-[13px]" style={{ backgroundColor: "var(--paper)", color: "var(--muted)" }}>{dictTarget}</p>}
          {match && <div className="mt-2"><SimpleRecorder compact label="🎙 Say the sentence" /></div>}
        </>
      )}
    </div>
  );
}

function StepRow({ done, onClick, n, label, accent, recorder }: { done: boolean; onClick: () => void; n: number; label: string; accent: Accent; recorder?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left text-[14px] font-medium"
      style={{ borderColor: done ? accent.solid : "var(--line)", backgroundColor: done ? "var(--accent-soft)" : "var(--paper)", color: "var(--ink)" }}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: accent.solid }}>{done ? "✓" : n}</span>
      {label}
      {recorder && <span className="ml-auto"><SimpleRecorder compact label="🎙" /></span>}
    </button>
  );
}

function SectionHead({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold" style={{ backgroundColor: done ? "#2ea88f" : "var(--line)", color: done ? "#fff" : "var(--muted)" }}>{done ? "✓" : n}</span>
      <p className="text-[12px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>{title}</p>
    </div>
  );
}

/* -------------------------------- detail -------------------------------- */
export default function UnitDetail({ item, entry, onChange, onClose, source, challenge, inlineLesson }: {
  item: LearningItem; entry: ProgressEntry; onChange: (p: Partial<ProgressEntry>) => void; onClose: () => void;
  source?: LessonSource; challenge?: string;
  /** Pre-built lesson (e.g. a pasted YouTube video) that skips fetching. */
  inlineLesson?: Segment | null;
}) {
  const acc = accents[item.accent];
  const [seg, setSeg] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsText, setNeedsText] = useState(false);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [phraseMarks, setPhraseMarks] = useState<Record<string, boolean>>({});
  const [shadowDone, setShadowDone] = useState(0);
  const [ladderDone, setLadderDone] = useState(false);
  const [challengeDone, setChallengeDone] = useState(false);
  const cacheKey = source?.cacheKey ?? `rts-seg-${item.level}-${item.videoId}-${item.seg}`;

  const applySegment = useCallback((s: Segment) => { setSeg(s); setLoading(false); setNeedsText(false); try { localStorage.setItem(cacheKey, JSON.stringify(s)); } catch {} }, [cacheKey]);

  const loadFromTranscript = async () => {
    setBusy(true);
    try {
      const r = await fetch(source?.pasteUrl ?? "/api/youtube-lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${item.videoId}`, level: item.level, transcript: paste }) });
      const d = await r.json();
      if (!r.ok || d.needsTranscript) return;
      applySegment({ title: d.title, author: d.author, start: 0, passage: d.transcript, chunks: (d.chunks ?? []).map((c: { phrase: string; meaning: string; context: string }) => ({ word: c.phrase, part_of_speech: "spoken chunk", meaning: c.meaning, example: c.context })), shadows: d.shadowLines ?? [], questions: d.questions ?? [], frames: d.answerFrames ?? [], writingPrompt: d.writingPrompt ?? "", thinkPrompts: d.thinkPrompts ?? [], wordCount: d.transcript.split(/\s+/).length, challenge });
    } finally { setBusy(false); }
  };

  useEffect(() => {
    stopNeural();
    setLoading(true); setSeg(null); setNeedsText(false); setLadderDone(false); setChallengeDone(false);
    // Pre-built lesson (pasted video): render the exact same engine, no fetch.
    if (inlineLesson) {
      applySegment({ ...inlineLesson, challenge: inlineLesson.challenge ?? challenge });
      return;
    }
    const cached = localStorage.getItem(cacheKey);
    if (cached) { applySegment(JSON.parse(cached) as Segment); return; }
    let alive = true;
    fetch(source?.fetchUrl ?? `/api/lesson?v=${item.videoId}&level=${item.level}&seg=${item.seg}`)
      .then((r) => r.json())
      .then((d) => { if (!alive) return; d.needsTranscript ? (setLoading(false), setNeedsText(true)) : (challenge && (d.challenge = challenge), applySegment(d as Segment)); })
      .catch(() => alive && (setLoading(false), setNeedsText(true)));
    return () => { alive = false; };
  }, [item, cacheKey, applySegment, source, challenge, inlineLesson]);

  const playAll = () => {
    if (!seg) return;
    stopNeural(); setPlaying(true);
    playNeural(seg.passage, { voice: LEVEL_VOICE, level: item.level, rate, onEnd: () => { setPlaying(false); const l = entry.listens + 1; onChange({ listens: l, readingUnlocked: entry.readingUnlocked || l >= UNLOCK_LISTENS }); } });
  };

  // completion requires the speaking work
  const phrasesPracticed = Object.keys(phraseMarks).filter((k) => phraseMarks[k]).length;
  const steps = {
    listen: entry.readingUnlocked || entry.listens >= 1,
    shadow: shadowDone >= 3,
    phrases: phrasesPracticed >= 3,
    build: ladderDone,
    challenge: challengeDone,
  };
  const canComplete = steps.listen && steps.shadow && steps.phrases && steps.build && steps.challenge;

  const markPhrase = (w: string, v: boolean) => setPhraseMarks((m) => ({ ...m, [w]: v }));

  const client = useMemo(() => (seg ? isClientContext(source?.topic ?? item.topic, seg.passage, seg.challenge ?? challenge) : false), [seg, source, item.topic, challenge]);
  const ladder = useMemo(() => (seg ? buildLadder({ chunks: seg.chunks, question: seg.questions[3] ?? seg.questions[0] ?? item.summary, client }) : null), [seg, client, item.summary]);
  const stems = useMemo(() => (seg ? buildStems(seg.questions[0] ?? item.summary, seg.chunks) : []), [seg, item.summary]);
  const think = useMemo(() => (seg ? (seg.thinkPrompts?.length === 3 ? seg.thinkPrompts : thinkTasks(seg.passage, client)) : []), [seg, client]);
  const prep = useMemo(() => (seg ? challengePrep(seg.chunks, seg.frames, seg.passage, client) : null), [seg, client]);

  return (
    <div className="rts-fade">
      <button onClick={onClose} className="mb-5 inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted)" }}><span>←</span> {source?.backLabel ?? "Back"}</button>

      <header className="rounded-3xl border p-6 sm:p-7" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[.15em]" style={{ color: acc.text }}>
          <span className="rounded-full px-2.5 py-1 text-white" style={{ backgroundColor: acc.solid }}>{source?.badge ?? `Unit ${item.number} · ${item.level}`}</span>
          <span style={{ color: "var(--muted)" }}>{seg?.author ?? "Loading…"}</span>
        </div>
        <h1 className="mt-3 font-display text-[clamp(1.5rem,4vw,2.2rem)] font-semibold leading-tight">{seg?.title ?? item.title}</h1>
        <p className="mt-2 rounded-xl px-3 py-2 text-[14px] font-semibold leading-snug" style={{ backgroundColor: "var(--accent-soft)", color: "var(--ink)" }}>🎯 {item.summary}</p>
      </header>

      {loading && <div className="mt-6 rounded-3xl border p-10 text-center text-sm" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--muted)" }}>Loading the lesson…</div>}

      {needsText && (
        <div className="mt-6 rounded-3xl border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
          <SceneEmbed videoId={item.videoId} start={source?.videoStart ?? 0} title="Lesson" />
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>The video is ready. On YouTube tap <b>⋯ → Show transcript</b>, copy 30–90 seconds, and paste below.</p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={7} placeholder="Paste the English transcript…" className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          <button onClick={loadFromTranscript} disabled={busy || paste.trim().split(/\s+/).length < 15} className="mt-3 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: acc.solid }}>{busy ? "Building…" : "Build lesson"}</button>
        </div>
      )}

      {seg && ladder && prep && (
        <div className="mt-6 space-y-8">
          {/* 1 watch */}
          <section>
            <SectionHead n={1} title="Watch" done={steps.listen} />
            <div className="mt-2"><SceneEmbed videoId={item.videoId} start={source?.videoStart ?? seg.start} title={seg.title} /></div>
          </section>

          {/* 2 listen + interactive transcript */}
          <section className="rounded-3xl border p-4 sm:p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
            <SectionHead n={2} title={`Listen · ${seg.wordCount} words`} done={steps.listen} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={playing ? () => { stopNeural(); setPlaying(false); } : playAll} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: acc.solid }}>
                {playing ? "■ Stop" : "▶ Play all"}
              </button>
              <label className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--muted)" }}>Speed
                <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="rounded-lg border px-2 py-1 text-[12px]" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }}>
                  <option value={0.8}>0.8×</option><option value={1}>1×</option><option value={1.15}>1.15×</option>
                </select>
              </label>
            </div>
            <div className="mt-3"><InteractiveTranscript passage={seg.passage} level={item.level} compact /></div>
          </section>

          {/* 3 shadow */}
          <section>
            <SectionHead n={3} title="Shadow · listen, copy, repeat without looking" done={steps.shadow} />
            <p className="mb-2 mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Listen → shadow out loud → hide & repeat.</p>
            <ShadowDrill lines={seg.shadows.slice(0, 6)} level={item.level} onProgress={(n) => setShadowDone(n)} />
          </section>

          {/* 4 phrases */}
          <section>
            <SectionHead n={4} title={`Phrases · ${phrasesPracticed} practiced`} done={steps.phrases} />
            <p className="mb-2 mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Listen · repeat · then build your own sentence. Don't collect words — use them.</p>
            <PhrasePractice chunks={seg.chunks.slice(0, 8)} level={item.level} context={client ? "client" : "everyday"}
              marks={entry.wordMarks ?? {}} setMark={(w, v) => onChange({ wordMarks: { ...(entry.wordMarks ?? {}), [w]: v } })}
              practiced={phraseMarks} setPracticed={markPhrase} />
          </section>

          {/* 5 build */}
          <section>
            <SectionHead n={5} title="Build your answer" done={steps.build} />
            <p className="mb-2 mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Expand one idea step by step, then say it without looking.</p>
            <BuildAnswer prompt={seg.questions[0] ?? item.summary} level={item.level} stems={stems} storageKey={`${cacheKey}-build`} />
          </section>

          {/* 6 think */}
          <section className="rounded-3xl border p-4 sm:p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
            <SectionHead n={6} title="Think in English · finish & personalize" />
            <div className="mt-3 grid gap-2">
              {think.map((t, i) => (
                <ThinkRow key={i} n={i + 1} text={t} level={item.level} />
              ))}
            </div>
          </section>

          {/* 7 speak ladder */}
          <section>
            <SectionHead n={7} title="Speak step by step" done={ladderDone} />
            <div className="mt-2"><SpeakingLadder level={item.level} rungs={ladder} storageKey={`${cacheKey}-ladder`} onComplete={() => { setLadderDone(true); onChange({ speakingDone: true }); }} /></div>
          </section>

          {/* 8 challenge */}
          <section>
            <SectionHead n={8} title="Speaking challenge" done={steps.challenge} />
            <div className="mt-2">
              <SpeakingChallenge
                task={seg.challenge ?? challenge ?? item.summary}
                phrases={prep.phrases} starters={prep.starters} ideas={prep.ideas} personalQuestion={prep.personalQuestion}
                storageKey={`${cacheKey}-challenge`} onDone={() => { setChallengeDone(true); onChange({ speakingDone: true }); }} />
            </div>
          </section>

          {/* 9 write */}
          <section>
            <SectionHead n={9} title="Write, then say it" />
            <div className="mt-2"><WriteToSpeak storageKey={`rts-write-${item.key}-${source?.badge ?? item.seg}`} prompt={seg.writingPrompt} model={seg.passage} accent={acc} level={item.level} /></div>
          </section>

          {/* complete */}
          <section className="rounded-3xl border p-6 text-center" style={{ borderColor: canComplete ? acc.solid : "var(--line)", backgroundColor: entry.completed ? "var(--accent-soft)" : "var(--card)" }}>
            {entry.completed ? (
              <>
                <p className="font-display text-xl font-semibold" style={{ color: acc.text }}>Lesson complete</p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>You actually used English today.</p>
                <button onClick={() => onChange({ completed: false })} className="mt-3 text-sm font-semibold underline" style={{ color: acc.text }}>Reopen</button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{canComplete ? "Ready" : "Complete the speaking steps:"}</p>
                {!canComplete && (
                  <ul className="mx-auto mt-2 max-w-xs space-y-1 text-left text-[13px]" style={{ color: "var(--muted)" }}>
                    {!steps.listen && <li>• Listen once</li>}
                    {!steps.shadow && <li>• Finish 3 shadow lines</li>}
                    {!steps.phrases && <li>• Practice 3 phrases</li>}
                    {!steps.build && <li>• Build your answer</li>}
                    {!steps.challenge && <li>• Do the speaking challenge</li>}
                  </ul>
                )}
                <button disabled={!canComplete} onClick={() => onChange({ completed: true, readingUnlocked: true })}
                  className="mt-4 w-full rounded-2xl px-6 py-3.5 font-bold text-white transition disabled:opacity-40" style={{ backgroundColor: acc.solid }}>
                  Finish lesson
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ThinkRow({ n, text, level }: { n: number; text: string; level: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen((v) => !v)} className="flex items-start gap-3 rounded-2xl border p-3 text-left"
      style={{ borderColor: open ? "var(--accent-solid)" : "var(--line)", backgroundColor: open ? "var(--accent-soft)" : "var(--paper)" }}>
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>{n}</span>
      <span className="flex-1 text-[14px] font-medium">{text}</span>
      {open && <span className="mt-0.5"><PlayButton text={text} level={level} label="Hear the task" /></span>}
    </button>
  );
}

function SceneEmbed({ videoId, start, title }: { videoId: string; start: number; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", backgroundColor: "#000" }}>
      <div className="relative aspect-video w-full">
        {!loaded && (
          <button onClick={() => setLoaded(true)} className="absolute inset-0" aria-label={`Play ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-85" loading="lazy" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--accent-solid)] text-white">▶</span>
          </button>
        )}
        {loaded && <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&cc_load_policy=1&hl=en&start=${start}`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
      </div>
    </div>
  );
}
