"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LearningItem } from "@/data/courses";
import { accents, type Accent, type ProgressEntry } from "@/lib/accents";
import { loadProgress, saveProgress, loadProgressSync } from "@/lib/progressStore";
import { myContentLessons, myContentIntro } from "@/data/myContent";
import { curriculumWeeks } from "@/data/curriculum";
import UnitDetail from "@/components/UnitDetail";
import ThemeToggle from "@/components/ThemeToggle";

const empty: ProgressEntry = { listens: 0, readingUnlocked: false, wordMarks: {}, speakingDone: false, completed: false };
const DAY_KEY = "rts-mc-day";

export default function MyContentPage() {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [day, setDay] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<number>(1);

  useEffect(() => {
    setProgress(loadProgressSync());
    void loadProgress().then(setProgress);
    setDay(Math.min(myContentLessons.length, Math.max(1, Number(localStorage.getItem(DAY_KEY) ?? "1"))));
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

  const doneCount = myContentLessons.filter((l) => progress[l.id]?.completed).length;
  const phrasesUsed = myContentLessons.reduce((n, l) => n + Object.values(progress[l.id]?.wordMarks ?? {}).reduce((a, b) => a + b, 0), 0);
  const selectedLesson = myContentLessons.find((l) => l.id === selected) ?? null;

  const finishLesson = (p: Partial<ProgressEntry>) => {
    if (!selectedLesson) return;
    const will = p.completed ?? progress[selectedLesson.id]?.completed;
    update(selectedLesson.id, p);
    if (will) {
      const nd = Math.min(myContentLessons.length, selectedLesson.day + 1);
      setDay(nd); localStorage.setItem(DAY_KEY, String(nd));
      setOpenWeek(curriculumWeeks[Math.min(curriculumWeeks.length - 1, Math.floor((nd - 1) / 5))]?.stage ? Math.floor((nd - 1) / 5) + 1 : 1);
    }
  };

  if (selectedLesson && items[selectedLesson.id]) {
    return (
      <main className="min-h-screen pb-24">
        <Shell />
        <section className="mx-auto mt-8 max-w-3xl px-5 sm:px-6">
          <UnitDetail
            item={items[selectedLesson.id]}
            entry={progress[selectedLesson.id] ?? empty}
            onChange={finishLesson}
            onClose={() => setSelected(null)}
            challenge={selectedLesson.focus}
            source={{
              fetchUrl: `/api/my-content?id=${selectedLesson.id}`,
              cacheKey: `rts-mc-${selectedLesson.id}`,
              pasteUrl: "/api/youtube-lab",
              badge: `MY TRACK · DAY ${selectedLesson.day}`,
              backLabel: "← Back to my track",
              levelLabel: "B1",
              videoStart: selectedLesson.start,
              topic: selectedLesson.tag,
            }}
          />
        </section>
      </main>
    );
  }

  const todayLesson = myContentLessons[day - 1];

  return (
    <main className="min-h-screen pb-24">
      <Shell />

      <section className="mx-auto mt-12 max-w-4xl px-5 sm:px-6">
        <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[var(--accent-text)]">Your personal track</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-tight tracking-tight">My 3-month speaking track</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">{myContentIntro.description}</p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-[var(--muted)]">
          <span><strong className="text-[var(--ink)]">{doneCount}</strong> / {myContentLessons.length} lessons</span>
          <span><strong className="text-[var(--ink)]">{phrasesUsed}</strong> phrases used</span>
          <span>Week {Math.min(12, Math.ceil(day / 5))} of 12</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
          <div className="h-full rounded-full bg-[var(--accent-solid)] transition-all" style={{ width: `${(doneCount / myContentLessons.length) * 100}%` }} />
        </div>

        {/* Today */}
        {todayLesson && (
          <div className="mt-9">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Today · Day {todayLesson.day}</p>
            <div className="mt-2">
              <LessonCard l={todayLesson} entry={progress[todayLesson.id]} onOpen={() => setSelected(todayLesson.id)} hero />
            </div>
          </div>
        )}

        {/* Weeks / stages */}
        <div className="mt-12 space-y-3">
          {curriculumWeeks.map((week, wi) => {
            const lessons = myContentLessons.filter((l) => l.week === wi + 1);
            const weekDone = lessons.filter((l) => progress[l.id]?.completed).length;
            const isOpen = openWeek === wi + 1;
            const isCurrent = todayLesson?.week === wi + 1;
            return (
              <div key={wi} className="overflow-hidden rounded-2xl border bg-[var(--card)]" style={{ borderColor: "var(--line)" }}>
                <button onClick={() => setOpenWeek(isOpen ? -1 : wi + 1)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: isCurrent ? "#1d6f5b" : "var(--muted)" }}>Week {wi + 1} · {weekDone}/{lessons.length}</span>
                    <span className="mt-0.5 block font-display text-[17px] font-semibold">{week.stage.replace(/^Week \d+ · /, "")}</span>
                  </span>
                  <span className="text-[var(--muted)]">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="grid gap-2 border-t p-3 sm:grid-cols-2" style={{ borderColor: "var(--line)" }}>
                    {lessons.map((l) => (
                      <LessonCard key={l.id} l={l} entry={progress[l.id]} onOpen={() => setSelected(l.id)} compact />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Shell() {
  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: "var(--line)", backgroundColor: "var(--header-bg)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg font-display text-base font-semibold" style={{ backgroundColor: "var(--mark-bg)", color: "var(--mark-fg)" }}>R</span>
          <span className="font-display text-lg font-semibold tracking-tight">Read to Speak</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] sm:gap-3">
          <Link href="/learn/b1-core" className="hidden sm:inline">Levels</Link>
          <Link href="/think" className="hidden sm:inline">Think</Link>
          <span className="rounded-full px-3 py-1.5 font-semibold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>My Track</span>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function LessonCard({ l, entry, onOpen, hero, compact }: {
  l: (typeof myContentLessons)[number]; entry?: ProgressEntry; onOpen: () => void; hero?: boolean; compact?: boolean;
}) {
  const acc: Accent = accents[l.accent];
  const done = !!entry?.completed;
  const started = !!(entry?.listens || entry?.speakingDone);
  return (
    <button onClick={onOpen} className={`group flex overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 ${hero ? "flex-col sm:flex-row" : ""}`}
      style={{ borderColor: done ? acc.line : "var(--line)", backgroundColor: done ? "var(--accent-soft)" : "var(--paper)" }}>
      <div className={`relative shrink-0 overflow-hidden ${hero ? "sm:w-64" : "w-20"} ${compact ? "hidden sm:block sm:w-24" : ""}`}>
        {hero ? (
          <div className="aspect-video h-full w-full sm:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${l.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
          </div>
        ) : (
          <div className="h-full min-h-[84px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${l.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: acc.text }}>{l.tag}</p>
        <h3 className={`mt-1 font-display font-semibold leading-snug ${hero ? "text-xl" : "text-[15px]"}`}>{l.title}</h3>
        {hero && <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{l.benefit}</p>}
        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">{done ? "✓ Completed" : started ? "In progress" : `Day ${l.day} · ${l.speaker}`}</span>
          <span className="font-bold" style={{ color: acc.text }}>Open →</span>
        </div>
      </div>
    </button>
  );
}
