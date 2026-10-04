"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LabChunk, LabLesson } from "@/lib/youtubeLab";
import { playNeural, stopNeural } from "@/lib/neuralAudio";
import UnitDetail from "@/components/UnitDetail";
import type { LearningItem } from "@/data/courses";
import type { ProgressEntry } from "@/lib/accents";

const STORAGE = "rts-youtube-lab-v1";
const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
let pendingQuery = "";

/** Convert an auto-built LabLesson into the exact shape UnitDetail expects. */
function labToEngine(l: LabLesson): { item: LearningItem; segment: NonNullable<Parameters<typeof UnitDetail>[0]["inlineLesson"]>; entry: ProgressEntry } {
  const accent = "emerald" as const;
  const item: LearningItem = {
    key: `lab-${l.videoId}`,
    kind: "unit",
    number: 0,
    level: l.level,
    source: "video",
    title: l.title,
    topic: `Your video · ${l.level}`,
    grammar: "Steal the phrases people actually say.",
    grammarNote: "",
    duration: null,
    accent,
    passage: [],
    vocabulary: [],
    speakingPrompts: [],
    answerFrames: [],
    shadowLines: [],
    summary: "Explain your video's idea in your own words for 45–60 seconds.",
    voice: "andrew",
    videoId: l.videoId,
    seg: 0,
  };
  const segment = {
    title: l.title,
    author: l.author,
    start: 0,
    passage: l.transcript,
    chunks: l.chunks.map((c: LabChunk) => ({ word: c.phrase, part_of_speech: "spoken chunk", meaning: c.meaning, example: c.context })),
    shadows: l.shadowLines,
    questions: l.questions,
    frames: l.answerFrames,
    writingPrompt: l.writingPrompt ?? "Write 5–6 sentences retelling the clip and your reaction.",
    thinkPrompts: l.thinkPrompts ?? ["Finish: The speaker is talking about…", "Change one detail: If this happened to me…", "Personalize: In my life, I…"],
    wordCount: l.transcript.split(/\s+/).length,
    challenge: "Imagine a friend hasn't seen the clip. Summarize it, share your opinion, and give one example — in 60 seconds.",
  };
  const entry: ProgressEntry = { listens: 1, readingUnlocked: true, wordMarks: {}, speakingDone: false, completed: false };
  return { item, segment, entry };
}

export default function YouTubeLab() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"link" | "search">("link");
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState("B1");
  const [transcript, setTranscript] = useState("");
  const [lesson, setLesson] = useState<LabLesson | null>(null);
  const [saved, setSaved] = useState<LabLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [fullLesson, setFullLesson] = useState<LabLesson | null>(null);

  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem(STORAGE) ?? "[]")); } catch { /* */ } }, []);

  // Chunk buttons inside lessons open the YouGlish search tab directly.
  useEffect(() => {
    const handler = (e: Event) => {
      pendingQuery = (e as CustomEvent<string>).detail;
      setQuery(pendingQuery);
      setOpen(true); setTab("search");
    };
    window.addEventListener("open-youglish", handler);
    return () => window.removeEventListener("open-youglish", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (list: LabLesson[]) => { setSaved(list); localStorage.setItem(STORAGE, JSON.stringify(list.slice(0, 12))); };
  const reset = () => { setLesson(null); setTranscript(""); setError(""); };

  const analyze = async (manual?: string) => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/youtube-lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, level, transcript: manual ?? transcript }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not create the lesson.");
      setLesson(d);
      if (!d.needsTranscript) {
        persist([d, ...saved.filter((x) => !(x.videoId === d.videoId && x.level === d.level))]);
        // Open the SAME full lesson engine used by native units.
        setFullLesson(d);
        setOpen(false);
      }
    } catch (e2) { setError(e2 instanceof Error ? e2.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const engine = useMemo(() => (fullLesson ? labToEngine(fullLesson) : null), [fullLesson]);

  return (
    <>
      {/* A pasted YouTube video becomes a NATIVE full lesson (same engine). */}
      {fullLesson && engine && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ backgroundColor: "var(--paper)" }}>
          <div className="mx-auto max-w-3xl px-5 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setFullLesson(null)} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted)" }}><span>←</span> Back to lab</button>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: "var(--accent-solid)" }}>Your video · {fullLesson.level}</span>
            </div>
            <UnitDetail
              item={engine.item}
              entry={engine.entry}
              onChange={() => { /* custom lessons keep completion local to the existing flow */ }}
              onClose={() => setFullLesson(null)}
              challenge={engine.segment.challenge}
              inlineLesson={engine.segment}
              source={{
                fetchUrl: "",
                cacheKey: `rts-lab-${fullLesson.videoId}-${fullLesson.level}`,
                badge: `YOUR VIDEO · ${fullLesson.level}`,
                backLabel: "← Back to lab",
                levelLabel: fullLesson.level,
                topic: fullLesson.title,
              }}
            />
          </div>
        </div>
      )}

      <button onClick={() => setOpen(true)} className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-[var(--accent-solid)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(0,0,0,.5)] transition hover:-translate-y-0.5 sm:right-6">
        <YTIcon /><span className="hidden sm:inline">Real-video lab</span><span className="sm:hidden">Lab</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <aside className="absolute bottom-0 right-0 top-0 w-full max-w-2xl overflow-y-auto border-l" style={{ backgroundColor: "var(--paper)", borderColor: "var(--line)" }}>
            <div className="sticky top-0 z-10 border-b px-5 py-4" style={{ backgroundColor: "rgba(246,244,238,.94)", borderColor: "var(--line)", backdropFilter: "blur(8px)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#e88a7d]">Learn from real videos</p>
                  <h2 className="font-display text-2xl font-semibold">Your practice lab</h2>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--ink)" }} aria-label="Close">×</button>
              </div>
              <div className="mt-3 flex gap-2">
                {([["link", "Paste a link"], ["search", "Search real videos"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} className="rounded-full px-4 py-1.5 text-[13px] font-bold" style={{ backgroundColor: tab === id ? "var(--accent-solid)" : "var(--card)", color: tab === id ? "#fff" : "var(--muted)" }}>{label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {tab === "search" && <YouGlishSearch query={query} setQuery={setQuery} />}
              {tab === "link" && (
                <>
                  <div className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
                    <label className="text-[12px] font-bold" style={{ color: "var(--ink)" }}>Paste any YouTube link</label>
                    <input value={url} onChange={(e) => { setUrl(e.target.value); reset(); }} placeholder="https://www.youtube.com/watch?v=…" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <label className="text-[12px] font-bold" style={{ color: "var(--ink)" }}>Level
                        <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 block rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }}>{levels.map((x) => <option key={x}>{x}</option>)}</select>
                      </label>
                      <button onClick={() => analyze()} disabled={loading || !url.trim()} className="ml-auto rounded-xl bg-[var(--accent-solid)] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{loading ? "Opening…" : "Open & build lesson"}</button>
                    </div>
                    {error && <p className="mt-3 text-sm text-[#e88a7d]">{error}</p>}
                  </div>

                  {lesson && <LabVideo lesson={lesson} />}

                  {lesson?.needsTranscript && (
                    <div className="rounded-3xl border p-5" style={{ borderColor: "#55381d", backgroundColor: "#211a10" }}>
                      <p className="font-bold text-[#efac72]">One step — paste the transcript</p>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                        The video is ready above. On YouTube tap <b>⋯ → Show transcript</b>, copy 30–90 seconds (with English captions), and paste it here. It becomes the exact same full lesson as the units.
                      </p>
                      <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={7} placeholder="Paste the English transcript here…" className="mt-3 w-full rounded-xl border p-3 text-sm outline-none" style={{ borderColor: "#55381d", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
                      <button onClick={() => analyze()} disabled={loading || transcript.trim().split(/\s+/).length < 15} className="mt-3 rounded-xl bg-[var(--accent-solid)] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{loading ? "Building…" : "Build the full lesson"}</button>
                      <p className="mt-2 text-[12px]" style={{ color: "var(--muted)" }}>{transcript.trim() ? transcript.trim().split(/\s+/).length : 0} words — 15 or more works best.</p>
                    </div>
                  )}

                  {lesson && !lesson.needsTranscript && <LabResult lesson={lesson} />}

                  {saved.length > 0 && (
                    <section className="border-t pt-6" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center justify-between"><h3 className="font-display text-xl font-semibold">Saved clips</h3><button onClick={() => persist([])} className="text-xs underline" style={{ color: "var(--muted)" }}>Clear</button></div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {saved.map((x) => <button key={x.id} onClick={() => { if (!x.needsTranscript) { setFullLesson(x); setOpen(false); } else { setLesson(x); setUrl(x.url); setLevel(x.level); } }} className="flex gap-3 rounded-2xl border p-3 text-left" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}><img src={x.thumbnail} alt="" className="h-14 w-20 rounded-lg object-cover" /><span><span className="line-clamp-2 text-xs font-bold">{x.title}</span><span className="mt-1 block text-[11px]" style={{ color: "var(--muted)" }}>{x.level} · {x.chunks.length} chunks</span></span></button>)}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ------------------------------ YouGlish ------------------------------ */
function YouGlishSearch({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<{ fetch: (q: string, lang: string, accent: number) => void } | null>(null);
  const [status, setStatus] = useState("");
  const initialRef = useRef(pendingQuery);

  useEffect(() => {
    let cancelled = false;
    const init = () => {
      const YG = (window as unknown as { YG?: any }).YG;
      if (YG && hostRef.current && !widgetRef.current) {
        try {
          widgetRef.current = new YG.Widget(hostRef.current, { width: "100%", height: 520, events: { onFetchDone: (e: any) => setStatus(e?.totalResult ? `${e.totalResult} real videos — use the arrows to flip between them.` : "No videos found — try shorter words.") } });
        } catch { /* */ }
      }
    };
    if ((window as unknown as { YG?: any }).YG) init();
    else {
      const s = document.createElement("script");
      s.src = "https://youglish.com/public/emb/widget.js"; s.async = true; s.onload = () => !cancelled && init();
      document.head.appendChild(s);
    }
    return () => { cancelled = true; };
  }, []);

  // Auto-search when opened from a chunk button.
  useEffect(() => {
    if (initialRef.current) {
      setQuery(initialRef.current);
      pendingQuery = "";
      const t = window.setTimeout(() => run(initialRef.current), 700);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (q: string) => {
    setStatus("Searching real videos…");
    if (widgetRef.current) widgetRef.current.fetch(q, "EN", 1); // 1 = American English
    else window.setTimeout(() => run(q), 300);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <p className="text-sm font-semibold">Type any word or sentence, hear it in real videos</p>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>Powered by YouGlish — American clips from movies, shows, and interviews. Use ← → arrows inside the player to flip through videos, exactly like youglish.com.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) run(query.trim()); }} className="mt-3 flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. it turns out, no big deal, I was like…" className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
          <button className="rounded-xl bg-[var(--accent-solid)] px-5 py-3 text-sm font-bold text-white">Search</button>
        </form>
        {status && <p className="mt-2 text-[12px]" style={{ color: "var(--muted)" }}>{status}</p>}
        <a href={`https://youglish.com/pronounce/${encodeURIComponent(query || "phrase")}/english/us`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[12px] font-semibold text-[#e88a7d] underline">Open on youglish.com ↗</a>
      </div>
      <div ref={hostRef} className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--line)", backgroundColor: "#0a0c0f", minHeight: 540 }} />
      <p className="text-[12px]" style={{ color: "var(--muted)" }}>Tip: shadow 2–3 clips per phrase, then say it in your own sentence.</p>
    </div>
  );
}
/* ------------------------------ link lesson ------------------------------ */
function LabVideo({ lesson }: { lesson: LabLesson }) {
  return (
    <section className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--line)", backgroundColor: "#0a0c0f" }}>
      <div className="aspect-video"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${lesson.videoId}?rel=0&cc_load_policy=1&hl=en`} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
      <div className="flex items-start justify-between gap-3 p-4 text-white">
        <div><p className="text-xs" style={{ color: "var(--muted)" }}>{lesson.author} · {lesson.level}</p><h3 className="mt-1 font-display text-xl font-semibold leading-snug">{lesson.title}</h3></div>
        <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-white px-3 py-2 text-[12px] font-bold text-black">YouTube ↗</a>
      </div>
    </section>
  );
}

function LabTalkButton({ text, voice, level, label }: { text: string; voice: string; level: string; label: string }) {
  const [on, setOn] = useState(false);
  return (
    <button type="button" title={label} aria-label={label}
      onClick={() => { stopNeural(); setOn(true); playNeural(text, { voice: voice as "ava" | "andrew", level, onEnd: () => setOn(false) }); }}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border" style={{ borderColor: "var(--line)", backgroundColor: on ? "var(--accent-soft)" : "var(--paper)", color: "var(--accent-text)" }}>
      <span className={on ? "rts-pulse" : ""}>{on ? "❚❚" : "▶"}</span>
    </button>
  );
}

function LabResult({ lesson }: { lesson: LabLesson }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [thinkDone, setThinkDone] = useState<boolean[]>((lesson.thinkPrompts ?? []).map(() => false));
  const [writing, setWriting] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobChunks = useRef<Blob[]>([]);
  const storageKey = `rts-lab-writing-${lesson.videoId}-${lesson.level}`;

  useEffect(() => { setWriting(localStorage.getItem(storageKey) ?? ""); }, [storageKey]);

  const record = async () => {
    if (recording) { recRef.current?.stop(); streamRef.current?.getTracks().forEach((t) => t.stop()); setRecording(false); return; }
    const s = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!s) return;
    streamRef.current = s; blobChunks.current = [];
    const rec = new MediaRecorder(s); recRef.current = rec;
    rec.ondataavailable = (e) => e.data.size && blobChunks.current.push(e.data);
    rec.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(blobChunks.current, { type: rec.mimeType || "audio/webm" })));
    rec.start(); setRecording(true);
  };
  const target = { A1: 30, A2: 45, B1: 60, B2: 90, C1: 120, C2: 150 }[lesson.level] ?? 60;

  return (
    <div className="space-y-7">
      {/* listen */}
      <section className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] [var(--accent-text)]">1 · Listen</p>
        <div className="mt-3 flex items-center gap-3">
          <LabTalkButton text={lesson.transcript} voice={lesson.voice} level={lesson.level} label="Listen to the scene" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Listen for the situation, then for the phrases below. General American voice.</p>
        </div>
      </section>

      {/* shadow */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#efac72]">2 · Shadow — copy the rhythm 3× each</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {lesson.shadowLines.map((l) => (
            <div key={l} className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
              <LabTalkButton text={l} voice={lesson.voice} level={lesson.level} label="Shadow this line" />
              <strong className="text-[14px] leading-snug">{l}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* chunks */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] [var(--accent-text)]">3 · Steal these phrases</p>
        <div className="mt-3 space-y-2">
          {lesson.chunks.map((x: LabChunk, i) => (
            <div key={`${x.phrase}-${i}`} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
              <div className="flex items-center gap-2">
                <strong className="text-[17px]">{x.phrase}</strong>
                <LabTalkButton text={`${x.phrase}. ${x.context}`} voice={lesson.voice} level={lesson.level} label="Hear phrase and example" />
                <button onClick={() => window.dispatchEvent(new CustomEvent("open-youglish", { detail: x.phrase }))} className="grid h-9 w-9 place-items-center rounded-full border" title="Hear it in real videos (YouGlish)" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#efac72"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12Z" /></svg>
                </button>
              </div>
              <p className="mt-1 text-[13px] [var(--accent-text)]">{x.meaning}</p>
              <p className="mt-1 text-sm italic" style={{ color: "var(--muted)" }}>“{x.context}”</p>
            </div>
          ))}
        </div>
      </section>

      {/* read */}
      <section className="rounded-3xl border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] [var(--accent-text)]">4 · Read the scene</p>
          <LabTalkButton text={lesson.transcript} voice={lesson.voice} level={lesson.level} label="Read along" />
        </div>
        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-[15px] leading-[1.85]">{lesson.transcript}</p>
      </section>

      {/* think */}
      <section className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#efac72]">5 · Think in English — don't translate</p>
        <ul className="mt-3 space-y-2">
          {(lesson.thinkPrompts ?? []).map((p, i) => (
            <li key={p}>
              <button onClick={() => { const n = [...thinkDone]; n[i] = !n[i]; setThinkDone(n); }} className="flex w-full items-start gap-3 rounded-2xl border p-3 text-left" style={{ borderColor: thinkDone[i] ? "var(--accent-solid)" : "var(--line)", backgroundColor: thinkDone[i] ? "var(--accent-soft)" : "var(--paper)" }}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-solid)] text-[11px] font-bold text-white">{i + 1}</span>
                <span className="text-sm font-medium">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* speak */}
      <section className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "#080a0d" }}>
        <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--muted)" }}>6 · Speak out loud</p>
        <ol className="mt-3 space-y-3">{lesson.questions.map((q, i) => (
          <li key={q} className="flex gap-3 text-sm text-white"><span className="font-bold [var(--accent-text)]">{i + 1}</span><span>{q}{lesson.answerFrames[i] && <em className="mt-1 block text-[13px]" style={{ color: "var(--muted)" }}>Start with: “{lesson.answerFrames[i]}”</em>}</span></li>
        ))}</ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={record} className="rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: recording ? "#b0473f" : "var(--accent-solid)" }}>{recording ? "● Stop recording" : "🎙 Record my answer"}</button>
          {audioUrl && <audio src={audioUrl} controls className="h-10 min-w-0 flex-1" />}
        </div>
      </section>

      {/* write */}
      <section className="rounded-3xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] [var(--accent-text)]">7 · Write</p>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{lesson.writingPrompt}</p>
        <textarea value={writing} onChange={(e) => { setWriting(e.target.value); localStorage.setItem(storageKey, e.target.value); }} rows={6} placeholder="Write your answer…" className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
        <div className="mt-2 text-[12px]" style={{ color: "var(--muted)" }}>{writing.trim() ? writing.trim().split(/\s+/).length : 0} / {target} words · saved on this device</div>
      </section>
    </div>
  );
}

function YTIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12Z" /></svg>; }
