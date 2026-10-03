"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LearningItem, VocabItem } from "@/data/courses";
import { accents, MAX_MARKS, type ProgressEntry, type Accent } from "@/lib/accents";
import { playNeural, stopNeural } from "@/lib/neuralAudio";

const UNLOCK_LISTENS = 1;

type Segment = {
  title: string; author: string; start: number; passage: string;
  chunks: VocabItem[]; shadows: string[]; questions: string[];
  frames: string[]; writingPrompt: string; thinkPrompts: string[]; wordCount: number;
  challenge?: string;
};

/* ----------------------- small audio icon button ----------------------- */
function Talk({ text, level, voice, label, big }: { text: string; level: string; voice: string; label: string; big?: boolean }) {
  const [on, setOn] = useState(false);
  const go = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopNeural();
    setOn(true);
    playNeural(text, { voice: voice as "ava" | "andrew", level, onEnd: () => setOn(false) });
  };
  return (
    <button type="button" onClick={go} aria-label={label} title={label}
      className={`grid place-items-center rounded-full border transition hover:scale-105 ${big ? "h-11 w-11" : "h-8 w-8"}`}
      style={{ borderColor: "var(--line)", color: "var(--accent-text)", backgroundColor: on ? "var(--accent-soft)" : "var(--card)" }}>
      <span className={on ? "rts-pulse" : ""}>{on ? "❚❚" : "▶"}</span>
    </button>
  );
}

function RealVideosButton({ query, accent }: { query: string; accent: Accent }) {
  return (
    <button type="button" title="Hear it in real videos" aria-label="Hear this phrase in real videos"
      onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-youglish", { detail: query })); }}
      className="grid h-8 w-8 place-items-center rounded-full border transition hover:scale-105"
      style={{ borderColor: accent.line, color: accent.text, backgroundColor: "var(--card)" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12Z" /></svg>
    </button>
  );
}

/* ------------------------------- recorder ------------------------------- */
function Recorder({ accent }: { accent: Accent }) {
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState("");
  const start = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!s) return;
    stream.current = s; chunks.current = [];
    const r = new MediaRecorder(s); rec.current = r;
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => { setUrl(URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType || "audio/webm" }))); s.getTracks().forEach((t) => t.stop()); setRecording(false); };
    r.start(); setRecording(true);
  };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" onClick={recording ? () => rec.current?.stop() : start} className="rounded-full px-4 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: recording ? "#b0473f" : accent.solid }}>
        {recording ? "● Stop" : "🎙 Record"}
      </button>
      {url && <audio src={url} controls className="h-10 min-w-0 flex-1" />}
    </div>
  );
}

/* ------------------------------ writing lab ----------------------------- */
function WritingLab({ storageKey, model, prompt, accent, level }: { storageKey: string; model: string; prompt: string; accent: Accent; level: string }) {
  const [tab, setTab] = useState<"retell" | "dictation">("retell");
  const [text, setText] = useState("");
  const [dictation, setDictation] = useState("");
  const [showModel, setShowModel] = useState(false);
  const target = { A1: 30, A2: 45, B1: 60, B2: 90, C1: 120, C2: 150 }[level] ?? 60;
  useEffect(() => { setText(localStorage.getItem(`${storageKey}-retell`) ?? ""); setDictation(localStorage.getItem(`${storageKey}-dict`) ?? ""); }, [storageKey]);
  const save = (kind: string, val: string) => { localStorage.setItem(`${storageKey}-${kind}`, val); };
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s']/g, " ").replace(/\s+/g, " ").trim();
  const dictTarget = useMemo(() => model.split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length <= 12)[0] ?? model, [model]);
  const match = dictation && norm(dictation) === norm(dictTarget);
  return (
    <div className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <div className="flex flex-wrap items-center gap-2">
        {(["retell", "dictation"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="rounded-full px-4 py-1.5 text-[12px] font-bold"
            style={{ backgroundColor: tab === t ? accent.solid : "var(--paper)", color: tab === t ? "#fff" : "var(--muted)" }}>
            {t === "retell" ? "Write it your way" : "Dictation"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{tab === "retell" ? prompt : "Listen, type the sentence, then check yourself. Spelling practice trains the same patterns as speaking."}</p>
      {tab === "retell" ? (
        <>
          <textarea value={text} onChange={(e) => { setText(e.target.value); save("retell", e.target.value); }} rows={6}
            placeholder="Write here…" className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: "var(--muted)" }}>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} / {target} words</span>
            <label className="flex items-center gap-2"><input type="checkbox" /> Used 2 chunks from the scene</label>
            <button onClick={() => setShowModel((v) => !v)} className="ml-auto font-semibold underline" style={{ color: accent.text }}>{showModel ? "Hide model" : "Show scene text"}</button>
          </div>
          {showModel && <p className="mt-3 rounded-2xl p-3 text-sm leading-relaxed" style={{ backgroundColor: "var(--paper)", color: "var(--muted)" }}>{model}</p>}
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <Talk text={dictTarget} level={level} voice="ava" label="Play dictation" big />
            <span className="text-sm" style={{ color: "var(--muted)" }}>Play, then type what you hear.</span>
          </div>
          <textarea value={dictation} onChange={(e) => { setDictation(e.target.value); save("dict", e.target.value); }} rows={3}
            className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          {dictation && <p className="mt-2 text-[13px] font-semibold" style={{ color: match ? "#54c79a" : "#e0a368" }}>{match ? "✓ Exact match" : "Not exact yet — replay and compare:"}</p>}
          {dictation && !match && <p className="mt-1 rounded-2xl p-3 text-sm" style={{ backgroundColor: "var(--paper)", color: "var(--muted)" }}>{dictTarget}</p>}
        </>
      )}
    </div>
  );
}

export type LessonSource = {
  fetchUrl: string;
  cacheKey: string;
  pasteUrl?: string;
  badge: string;
  backLabel: string;
  levelLabel: string;
  videoStart?: number;
};

/* -------------------------------- detail -------------------------------- */
export default function UnitDetail({ item, entry, onChange, onClose, source, challenge }: {
  item: LearningItem; entry: ProgressEntry; onChange: (p: Partial<ProgressEntry>) => void; onClose: () => void;
  source?: LessonSource; challenge?: string;
}) {
  const acc = accents[item.accent];
  const [seg, setSeg] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsText, setNeedsText] = useState(false);
  const [paste, setPaste] = useState("");
  const [busyPaste, setBusyPaste] = useState(false);
  const [rate, setRate] = useState(1);
  const [playingAll, setPlayingAll] = useState(false);
  const [thinkDone, setThinkDone] = useState<boolean[]>([false, false, false]);
  const cacheKey = source?.cacheKey ?? `rts-seg-${item.level}-${item.videoId}-${item.seg}`;
  const unlocked = entry.readingUnlocked || entry.listens >= UNLOCK_LISTENS;
  const marks = entry.wordMarks ?? {};
  const marksCount = Object.values(marks).reduce((a, b) => a + b, 0);

  const applySegment = useCallback((s: Segment) => {
    setSeg(s); setLoading(false); setNeedsText(false);
    localStorage.setItem(cacheKey, JSON.stringify(s));
  }, [cacheKey]);

  const loadFromTranscript = async () => {
    setBusyPaste(true);
    try {
      const r = await fetch(source?.pasteUrl ?? "/api/youtube-lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${item.videoId}`, level: item.level, transcript: paste }) });
      const d = await r.json();
      if (!r.ok || d.needsTranscript) return;
      applySegment({ title: d.title, author: d.author, start: 0, passage: d.transcript, chunks: (d.chunks ?? []).map((c: { phrase: string; meaning: string; context: string }) => ({ word: c.phrase, part_of_speech: "spoken chunk", meaning: c.meaning, example: c.context })), shadows: d.shadowLines ?? [], questions: d.questions ?? [], frames: d.answerFrames ?? [], writingPrompt: d.writingPrompt ?? "Retell this scene in your own words.", thinkPrompts: d.thinkPrompts ?? ["Narrate the scene in your head in English.", "When a word is missing, say it a simpler way.", "Turn one line into a sentence about your life."], wordCount: d.transcript.split(/\s+/).length, challenge });
    } finally { setBusyPaste(false); }
  };

  useEffect(() => {
    stopNeural();
    setLoading(true); setSeg(null); setNeedsText(false); setThinkDone([false, false, false]);
    const cached = localStorage.getItem(cacheKey);
    if (cached) { applySegment(JSON.parse(cached) as Segment); return; }
    let alive = true;
    const url = source?.fetchUrl ?? `/api/lesson?v=${item.videoId}&level=${item.level}&seg=${item.seg}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.needsTranscript) { setLoading(false); setNeedsText(true); }
        else { if (challenge) d.challenge = challenge; applySegment(d as Segment); }
      })
      .catch(() => alive && (setLoading(false), setNeedsText(true)));
    return () => { alive = false; };
  }, [item, cacheKey, applySegment, source, challenge]);

  const playScene = () => {
    if (!seg) return;
    stopNeural(); setPlayingAll(true);
    playNeural(seg.passage, { voice: item.voice, level: item.level, rate, onEnd: () => { setPlayingAll(false); const listens = entry.listens + 1; onChange({ listens, readingUnlocked: entry.readingUnlocked || listens >= UNLOCK_LISTENS }); } });
  };
  const setMarks = (m: Record<string, number>) => onChange({ wordMarks: m });
  const canComplete = unlocked && marksCount > 0 && entry.speakingDone;
  const chunks = seg?.chunks ?? [];
  const shadows = seg?.shadows ?? [];
  const questions = seg?.questions ?? [];
  const frames = seg?.frames ?? [];

  return (
    <div className="rts-fade">
      <button onClick={onClose} className="mb-6 inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80" style={{ color: "var(--muted)" }}><span>←</span> {source?.backLabel ?? "Back to scenes"}</button>

      <header className="rounded-3xl border p-7" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[.16em]" style={{ color: acc.text }}>
          <span className="rounded-full px-2.5 py-1 text-white" style={{ backgroundColor: acc.solid }}>{source?.badge ?? `Unit ${String(item.number).padStart(2, "0")} · ${item.level}`}</span>
          <span style={{ color: "var(--muted)" }}>{seg?.author ?? "Loading…"}</span>
        </div>
        <h1 className="mt-4 font-display text-[clamp(1.7rem,4vw,2.5rem)] font-semibold leading-tight">{seg?.title ?? `Scene ${item.number}`}</h1>
        <div className="mt-4 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--accent-soft)" }}>
          <p className="text-[11px] font-bold uppercase tracking-[.14em]" style={{ color: acc.text }}>Speaking goal</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug">{item.summary}</p>
        </div>
      </header>

      {loading && <div className="mt-8 rounded-3xl border p-10 text-center" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--muted)" }}>Opening the scene…</div>}

      {needsText && (
        <div className="mt-6 rounded-3xl border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
          <SceneEmbed videoId={item.videoId} start={0} title="Scene" />
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            The video is ready above. On YouTube tap <b>⋯ → Show transcript</b>, copy 30–90 seconds with English captions, and paste them below — the full scene lesson builds instantly.
          </p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={7} placeholder="Paste the English transcript here…"
            className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          <button onClick={loadFromTranscript} disabled={busyPaste || paste.trim().split(/\s+/).length < 15} className="mt-3 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: acc.solid }}>{busyPaste ? "Building…" : "Build the full lesson"}</button>
        </div>
      )}

      {seg && (
        <>
          {/* watch */}
          <section className="mt-6">
            <SectionKicker acc={acc}>1 · Watch</SectionKicker>
            <SceneEmbed videoId={item.videoId} start={source?.videoStart ?? seg.start} title={seg.title} />
          </section>

          {/* listen */}
          <section className="mt-8 rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
            <SectionKicker acc={acc}>2 · Listen · {seg.wordCount} words of real speech</SectionKicker>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={playingAll ? () => { stopNeural(); setPlayingAll(false); } : playScene} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: acc.solid }}>
                {playingAll ? "❚❚ Stop" : "▶ Listen to the scene"}
              </button>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>Speed
                <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }}>
                  <option value={0.75}>0.75×</option><option value={0.9}>0.9×</option><option value={1}>1×</option><option value={1.15}>1.15×</option>
                </select>
              </label>
              <span className="text-[12px]" style={{ color: "var(--muted)" }}>{entry.listens} listen{entry.listens === 1 ? "" : "s"} · same General American voice everywhere</span>
            </div>
          </section>

          {/* shadow */}
          <section className="mt-8">
            <SectionKicker acc={acc}>3 · Shadow — copy the rhythm, 3× each</SectionKicker>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {shadows.map((line) => (
                <div key={line} className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
                  <Talk text={line} level={item.level} voice={item.voice} label="Shadow this line" />
                  <span className="text-[15px] font-semibold leading-snug">{line}</span>
                </div>
              ))}
            </div>
          </section>

          {/* chunks */}
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <SectionKicker acc={acc}>4 · Steal these phrases</SectionKicker>
              <span className="rounded-full border px-3 py-1.5 text-[13px] font-semibold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>{marksCount} used</span>
            </div>
            <ul className="mt-3 divide-y divide-[color:var(--line)] rounded-2xl border" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
              {chunks.map((w) => (
                <li key={w.word} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-semibold">{w.word}</span>
                      <Talk text={`${w.word}. ${w.example}`} level={item.level} voice={item.voice} label="Hear phrase and example" />
                      <RealVideosButton query={w.word} accent={acc} />
                    </div>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>{w.meaning}</p>
                    <p className="mt-0.5 text-[14px] italic" style={{ color: "var(--muted)" }}>“{w.example}”</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {Array.from({ length: MAX_MARKS }).map((_, i) => (
                      <button key={i} onClick={() => { const c = marks[w.word] ?? 0; const next = c === i + 1 ? i : i + 1; setMarks({ ...marks, [w.word]: next }); }}
                        className="h-6 w-6 rounded-md border" style={{ borderColor: acc.line, backgroundColor: i < (marks[w.word] ?? 0) ? acc.solid : "var(--paper)" }} aria-label={`mark ${i + 1}`} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* transcript */}
          {unlocked ? (
            <section className="mt-8 rounded-3xl border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
              <div className="flex items-center justify-between gap-3">
                <SectionKicker acc={acc}>5 · Read the scene</SectionKicker>
                <Talk text={seg.passage} level={item.level} voice={item.voice} label="Read along" />
              </div>
              <p className="mt-3 text-[15px] leading-[1.85]">{seg.passage}</p>
            </section>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed p-10 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>Press <b>Listen to the scene</b> once to open the transcript.</div>
          )}

          {/* think in English */}
          <section className="mt-8 rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
            <SectionKicker acc={acc}>6 · Think in English — don't translate</SectionKicker>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Micro-thoughts: short, speakable sentences inside your head. Do these silently, then say #3 out loud.</p>
            <ul className="mt-3 space-y-2">
              {seg.thinkPrompts.map((p, i) => (
                <li key={p}>
                  <button onClick={() => { const n = [...thinkDone]; n[i] = !n[i]; setThinkDone(n); }} className="flex w-full items-start gap-3 rounded-2xl border p-3 text-left" style={{ borderColor: thinkDone[i] ? acc.solid : "var(--line)", backgroundColor: thinkDone[i] ? "var(--accent-soft)" : "var(--paper)" }}>
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: acc.solid }}>{i + 1}</span>
                    <span className="text-sm font-medium">{p}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* speak */}
          <section className="mt-8">
            <SectionKicker acc={acc}>7 · Speak out loud</SectionKicker>
            <ul className="mt-3 space-y-3">
              {questions.map((p, i) => (
                <li key={p} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
                  <div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: acc.solid }}>{i + 1}</span>
                    <div><p className="text-[15px] font-medium leading-snug">{p}</p>{frames[i] && <p className="mt-2 text-[13px] font-semibold" style={{ color: acc.text }}>Start with: <em>“{frames[i]}”</em></p>}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Recorder accent={acc} />

            {/* Speaking challenge */}
            {(seg.challenge || challenge) && (
              <div className="mt-5 rounded-3xl border-2 p-5" style={{ borderColor: acc.solid, backgroundColor: "var(--accent-soft)" }}>
                <p className="text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: acc.text }}>🎤 Speaking challenge · 60 seconds</p>
                <p className="mt-2 text-[16px] font-semibold leading-snug">{seg.challenge ?? challenge}</p>
                <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>Use at least two phrases from step 4. Start even if it isn't perfect — the goal is to speak without translating.</p>
              </div>
            )}

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-[15px] font-medium" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
              <input type="checkbox" checked={entry.speakingDone} onChange={(e) => onChange({ speakingDone: e.target.checked })} className="h-5 w-5" />
              I answered every prompt and did the speaking challenge out loud.
            </label>
          </section>

          {/* write */}
          <section className="mt-8">
            <SectionKicker acc={acc}>8 · Write</SectionKicker>
            <div className="mt-3"><WritingLab storageKey={`rts-writing-${item.key}`} model={seg.passage} prompt={seg.writingPrompt} accent={acc} level={item.level} /></div>
          </section>

          {/* complete */}
          <section className="mt-10">
            {entry.completed ? (
              <div className="rounded-3xl border p-8 text-center" style={{ borderColor: acc.line, backgroundColor: "var(--accent-soft)" }}>
                <p className="font-display text-xl font-semibold" style={{ color: acc.text }}>Scene complete.</p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>You watched, listened, shadowed, thought, spoke, and wrote in English.</p>
                <button onClick={() => onChange({ completed: false })} className="mt-3 text-sm font-semibold underline" style={{ color: acc.text }}>Reopen</button>
              </div>
            ) : (
              <button disabled={!canComplete} onClick={() => onChange({ completed: true })} className="w-full rounded-2xl px-6 py-4 font-semibold text-white transition disabled:opacity-40" style={{ backgroundColor: acc.solid }}>
                {canComplete ? "Finish this scene" : "Listen once, mark a phrase, and speak to finish"}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SectionKicker({ children, acc }: { children: React.ReactNode; acc: Accent }) {
  return <p className="text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: acc.text }}>{children}</p>;
}

function SceneEmbed({ videoId, start, title }: { videoId: string; start: number; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--line)", backgroundColor: "#000" }}>
      <div className="relative aspect-video w-full">
        {!loaded && (
          <button onClick={() => setLoaded(true)} className="group absolute inset-0" aria-label={`Play ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#c14b3d] text-white transition group-hover:scale-110">▶</span>
          </button>
        )}
        {loaded && <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&cc_load_policy=1&hl=en&start=${start}`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
      </div>
    </div>
  );
}
