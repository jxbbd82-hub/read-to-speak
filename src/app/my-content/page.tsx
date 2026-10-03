"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LearningItem } from "@/data/courses";
import { accents, type Accent, type ProgressEntry } from "@/lib/accents";
import { loadProgress, saveProgress, loadProgressSync } from "@/lib/progressStore";
import { myContentIntro, myContentLessons, MC_CATEGORY_LABEL, type McLesson } from "@/data/myContent";
import UnitDetail from "@/components/UnitDetail";

const empty: ProgressEntry = { listens: 0, readingUnlocked: false, wordMarks: {}, speakingDone: false, completed: false };
const DAY_KEY = "rts-mc-day"; // the next day number to study (1-based, persisted)

export default function MyContentPage() {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [day, setDay] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [filter, setFilter] = useState<"all" | McLesson["category"]>("all");

  useEffect(() => {
    setProgress(loadProgressSync());
    void loadProgress().then(setProgress);
    setDay(Math.min(90, Math.max(1, Number(localStorage.getItem(DAY_KEY) ?? "1"))));
  }, []);

  const update = useCallback((key: string, patch: Partial<ProgressEntry>) => {
    setProgress((prev) => {
      const cur = prev[key] ?? empty;
      const nextMap = { ...prev, [key]: { ...cur, ...patch } };
      saveProgress(nextMap);
      fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, ...nextMap[key] }) }).catch(() => {});
      return nextMap;
    });
  }, []);

  const items = useMemo<Record<string, LearningItem>>(() => {
    const map: Record<string, LearningItem> = {};
    for (const l of myContentLessons) {
      map[l.id] = {
        key: l.id, kind: "unit", number: l.day, level: "B1", source: "video",
        title: l.title, topic: l.tag, grammar: l.benefit, grammarNote: "", duration: null,
        accent: l.accent, passage: [], vocabulary: [], speakingPrompts: [], answerFrames: [],
        shadowLines: [], summary: l.focus, voice: "andrew", videoId: l.videoId, seg: 0,
      };
    }
    return map;
  }, []);

  const completedCount = myContentLessons.filter((l) => progress[l.id]?.completed).length;
  const chunksLearned = myContentLessons.reduce(
    (n, l) => n + Object.values(progress[l.id]?.wordMarks ?? {}).reduce((a, b) => a + b, 0),
    0,
  );
  const streak = (() => {
    let s = 0;
    for (let i = 1; i <= 90; i++) {
      const l = myContentLessons[i - 1];
      if (progress[l.id]?.completed) s++;
      else if (i < day) break;
    }
    return s;
  })();

  const today = myContentLessons[day - 1];
  const next = myContentLessons.slice(day, day + 3);
  const selectedLesson = myContentLessons.find((l) => l.id === selected) ?? null;

  const openLesson = (l: McLesson) => {
    setSelected(l.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishLesson = (p: Partial<ProgressEntry>) => {
    if (!selectedLesson) return;
    const willComplete = p.completed ?? progress[selectedLesson.id]?.completed;
    update(selectedLesson.id, p);
    if (willComplete && day <= 90) {
      const nd = Math.min(90, Math.max(day + 1, selectedLesson.day + 1));
      setDay(nd);
      localStorage.setItem(DAY_KEY, String(nd));
    }
  };

  if (selectedLesson && items[selectedLesson.id]) {
    return (
      <main className="min-h-screen pb-24">
        <Header />
        <section className="mx-auto mt-10 max-w-3xl px-6">
          <UnitDetail
            item={items[selectedLesson.id]}
            entry={progress[selectedLesson.id] ?? empty}
            onChange={finishLesson}
            onClose={() => setSelected(null)}
            challenge={selectedLesson.focus}
            source={{
              fetchUrl: `/api/my-content?id=${selectedLesson.id}`,
              cacheKey: `rts-mc-${selectedLesson.videoId}-${selectedLesson.day}`,
              pasteUrl: "/api/youtube-lab",
              badge: `MY CONTENT · Day ${selectedLesson.day}`,
              backLabel: "← Back to My Content",
              levelLabel: "B1",
              videoStart: selectedLesson.start,
            }}
          />
        </section>
      </main>
    );
  }

  const library = myContentLessons.filter((l) => filter === "all" || l.category === filter);

  return (
    <main className="min-h-screen pb-24">
      <Header />

      <section className="mx-auto mt-12 max-w-5xl px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[.2em] text-[#e88a7d]">Your personal track</p>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-tight">MY CONTENT</h1>
        <p className="mt-2 text-lg font-medium text-[var(--muted)]">{myContentIntro.tagline}</p>

        {/* compact stats */}
        <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
          <Stat label="Days done" value={completedCount} />
          <Stat label="Phrases used" value={chunksLearned} />
          <Stat label="Current day" value={`${Math.min(day, 90)}/90`} />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--line)" }}>
          <div className="h-full rounded-full bg-[#c14b3d] transition-all" style={{ width: `${(completedCount / 90) * 100}%` }} />
        </div>

        {/* TODAY */}
        <div className="mt-10">
          <p className="text-[12px] font-bold uppercase tracking-[.2em]" style={{ color: "var(--muted)" }}>Today</p>
          <LessonCard lesson={today} large progress={progress[today.id]} onOpen={() => openLesson(today)} />
        </div>

        {/* NEXT */}
        <div className="mt-8">
          <p className="text-[12px] font-bold uppercase tracking-[.2em]" style={{ color: "var(--muted)" }}>Next</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {next.map((l) => (
              <LessonCard key={l.id} lesson={l} progress={progress[l.id]} onOpen={() => openLesson(l)} />
            ))}
          </div>
        </div>

        {/* LIBRARY */}
        <div className="mt-10">
          <button onClick={() => setShowLibrary((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-[#e88a7d]">
            <span className="text-[12px] font-bold uppercase tracking-[.2em]">Library · 90 lessons</span>
            <span>{showLibrary ? "▴" : "▾"}</span>
          </button>
          {showLibrary && (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["all", "everyday", "work", "design", "client"] as const).map((c) => (
                  <button key={c} onClick={() => setFilter(c)} className="rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize"
                    style={{ backgroundColor: filter === c ? "#c14b3d" : "var(--card)", color: filter === c ? "#fff" : "var(--muted)", border: "1px solid var(--line)" }}>
                    {c === "all" ? "All" : MC_CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {library.map((l) => (
                  <LessonCard key={l.id} lesson={l} progress={progress[l.id]} onOpen={() => openLesson(l)} compact />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: "var(--line)", backgroundColor: "rgba(11,14,17,.85)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#080a0d] font-display text-base font-semibold text-white">R</span>
          <span className="font-display text-lg font-semibold tracking-tight">Read to Speak</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium sm:gap-4" style={{ color: "var(--muted)" }}>
          <Link href="/learn/b1-core" className="hidden sm:inline">Levels</Link>
          <Link href="/think" className="hidden sm:inline">Think</Link>
          <span className="rounded-full bg-[#c14b3d] px-3 py-1.5 font-semibold text-white">My Content</span>
        </nav>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-full border px-4 py-1.5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <strong className="text-[var(--ink)]">{value}</strong> <span style={{ color: "var(--muted)" }}>{label}</span>
    </span>
  );
}

function LessonCard({ lesson, progress: p, onOpen, large, compact }: { lesson: McLesson; progress?: ProgressEntry; onOpen: () => void; large?: boolean; compact?: boolean }) {
  const acc: Accent = accents[lesson.accent];
  const done = !!p?.completed;
  const started = !!(p?.listens || p?.speakingDone);
  return (
    <button onClick={onOpen} className={`group flex flex-col overflow-hidden rounded-3xl border text-left transition hover:-translate-y-0.5 ${large ? "sm:flex-row" : ""}`} style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}>
      <div className={`relative overflow-hidden ${large ? "sm:w-72 sm:shrink-0" : ""} ${compact ? "aspect-video" : "aspect-video sm:aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${lesson.videoId}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-85 transition group-hover:scale-[1.03]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: acc.solid }}>Day {lesson.day}</span>
        {done && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold text-white" style={{ backgroundColor: acc.solid }}>✓</span>}
        <span className="absolute inset-0 grid place-items-center text-3xl text-white/90">▶</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: acc.text }}>{lesson.tag}</p>
        <h3 className={`mt-1 font-display font-semibold leading-snug ${large ? "text-2xl" : "text-lg"}`}>{lesson.title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>{lesson.benefit}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-[12px]" style={{ color: "var(--muted)" }}>
          <span>{done ? "Completed" : started ? "In progress" : "Short lesson"}</span>
          <span className="font-bold" style={{ color: acc.text }}>Open →</span>
        </div>
      </div>
    </button>
  );
}
