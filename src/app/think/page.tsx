"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

// Research-backed trainer: micro-thoughts (3-sentence rule), action narration,
// small self-decisions in English, and "inner blanks" (simplify around missing
// words). The goal is to stop translating, not to be perfect.

type Drill = { title: string; why: string; prompt: string; starter: string; time: number };

const DRILLS: Drill[] = [
  { title: "Narrate now", why: "Self-generated input — your brain teaches itself.", prompt: "Describe exactly what you're doing and seeing, in 3 short English sentences.", starter: "I'm sitting… / I can see… / Next, I'll…", time: 60 },
  { title: "Tiny decisions", why: "Real conversation is full of small questions and choices.", prompt: "Answer yourself in English: What do I need next? What should I eat? Do I call now or later?", starter: "I need to… / Maybe I'll… / I'll do it after…", time: 45 },
  { title: "Name the scene", why: "Direct links between meaning and English words — no Arabic in the middle.", prompt: "Name 5 things you see and 3 actions happening, all in English.", starter: "There's a… / Somebody is… -ing…", time: 45 },
  { title: "Inner blank", why: "Fluency grows when you keep going instead of freezing.", prompt: "Think of a word you don't know in English. Describe it with words you do know, 2 ways.", starter: "It's like… / You use it to… / It's the opposite of…", time: 60 },
  { title: "Make it shorter", why: "Micro-thoughts beat internal essays; simple is fluent.", prompt: "Take a complicated thought in your head. Say it in the shortest English possible.", starter: "Basically… / I mean… / The point is…", time: 60 },
  { title: "Predict the next line", why: "Prediction trains the patterns you need in conversation.", prompt: "Imagine a scene (a shop, a phone call). Think what the other person will say, then your reply.", starter: "They'll probably say… / Then I'd say…", time: 75 },
];

const STREAK_KEY = "rts-think-streak-v1";
const LOG_KEY = "rts-think-log-v1";

export default function ThinkPage() {
  const [level, setLevel] = useState("B1");
  const [day, setDay] = useState(0);
  const [streak, setStreak] = useState(0);
  const [, setDone] = useState<boolean[]>(Array(DRILLS.length).fill(false));
  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState("");

  const drill = useMemo(() => DRILLS[day % DRILLS.length], [day]);

  useEffect(() => {
    const saved = Number(localStorage.getItem(STREAK_KEY) ?? 0);
    setStreak(saved);
    setDay(saved % DRILLS.length);
  }, []);

  const complete = () => {
    const count = Number(localStorage.getItem(STREAK_KEY) ?? 0) + 1;
    localStorage.setItem(STREAK_KEY, String(count));
    setStreak(count);
    const log = JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
    log.unshift({ date: new Date().toISOString(), drill: drill.title, level, notes });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 60)));
    setDay(count % DRILLS.length);
    setNotes("");
  };

  const record = async () => {
    if (recording) { rec.current?.stop(); stream.current?.getTracks().forEach((t) => t.stop()); setRecording(false); return; }
    const s = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!s) return;
    stream.current = s; chunks.current = [];
    const r = new MediaRecorder(s); rec.current = r;
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType || "audio/webm" })));
    r.start(); setRecording(true);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" style={{ color: "var(--muted)" }}>← Home</Link>
          <Link href="/my-content" className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>My Content</Link>
        </div>
        <ThemeToggle />
      </div>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: "var(--accent-text)" }}>5 minutes a day</p>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Think in English.</h1>
      <p className="mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>
        Your speaking is limited by how quickly you can form a thought in English. This trains the inner voice itself: short, speakable thoughts, no translation. Do it silently anywhere, then say #3 out loud.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm font-bold">Level
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="ml-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--ink)" }}>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <span className="ml-auto rounded-full border px-4 py-2 text-sm" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--muted)" }}>🔥 {streak} sessions</span>
      </div>

      <section className="mt-8 rounded-3xl border p-7" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <p className="text-[12px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>Micro-thought {day + 1}/{DRILLS.length}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">{drill.title}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{drill.why}</p>
        <div className="mt-5 rounded-2xl p-5" style={{ backgroundColor: "var(--paper)" }}>
          <p className="text-[17px] leading-relaxed">{drill.prompt}</p>
          <p className="mt-3 text-sm italic" style={{ color: "var(--muted)" }}>{drill.starter}</p>
          <p className="mt-3 text-[13px] font-bold text-[var(--accent-text)]">⏱ {drill.time}s — think in English only. Missing a word? Go around it, don't switch languages.</p>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional: write the thoughts you formed…" className="mt-4 w-full rounded-2xl border p-3 text-sm outline-none" style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: "var(--ink)" }} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={record} className="rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: recording ? "#b0473f" : "var(--accent-solid)" }}>{recording ? "● Stop recording" : "🎙 Say it out loud"}</button>
          {audioUrl && <audio src={audioUrl} controls className="h-10 min-w-0 flex-1" />}
          <button onClick={complete} className="ml-auto rounded-full px-6 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>Done — next drill →</button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
        <h3 className="font-display text-xl font-semibold">The rules that make it work</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <li><b style={{ color: "var(--ink)" }}>1 · Short beats smart.</b> Three simple sentences beat one translated essay.</li>
          <li><b style={{ color: "var(--ink)" }}>2 · Never freeze.</b> Unknown word → use a simple one or describe it: “the thing for cutting paper” instead of scissors.</li>
          <li><b style={{ color: "var(--ink)" }}>3 · Anchor it to real moments.</b> Coffee, walking, dishes — narrate the moment you're already in.</li>
          <li><b style={{ color: "var(--ink)" }}>4 · Collect inner blanks.</b> After each drill, look up the 1–2 words you missed and shadow them in the lesson.</li>
        </ol>
        <Link href="/learn/b1-core" className="mt-5 inline-block text-sm font-bold underline" style={{ color: "var(--accent-text)" }}>Back to the scenes →</Link>
      </section>
    </main>
  );
}
