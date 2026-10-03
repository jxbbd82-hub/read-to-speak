"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LearningItem } from "@/data/book";
import { accents, type ProgressEntry } from "@/lib/accents";
import { loadProgress, saveProgress, loadProgressSync } from "@/lib/progressStore";
import UnitDetail from "./UnitDetail";

const UNLOCK_LISTENS = 1;
const defaultEntry: ProgressEntry = {
  listens: 0,
  readingUnlocked: false,
  wordMarks: {},
  speakingDone: false,
  completed: false,
};

export default function BookExperience({ items, level, nextCourse }: { items: LearningItem[]; level?: string; nextCourse?: { href: string; label: string } }) {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Instant local render first, then merge with durable IndexedDB copy.
    const sync = loadProgressSync();
    setProgress(sync);
    setLoaded(true);
    void loadProgress().then((merged) => {
      if (!active) return;
      // One-time migration from old ordinal unit keys (a1-unit-3 …).
      const migrated = { ...merged };
      for (const item of items) {
        if (item.legacyKey && migrated[item.legacyKey] && !migrated[item.key]) {
          migrated[item.key] = migrated[item.legacyKey];
        }
      }
      setProgress(migrated);
      saveProgress(migrated);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((key: string, patch: Partial<ProgressEntry>) => {
    setProgress((prev) => {
      const cur = prev[key] ?? defaultEntry;
      const nextMap = { ...prev, [key]: { ...cur, ...patch } };
      saveProgress(nextMap);
      // Best-effort server backup when a database is configured.
      const entry = nextMap[key];
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, ...entry }),
      }).catch(() => {});
      return nextMap;
    });
  }, []);

  const selectedItem = items.find((i) => i.key === selected) ?? null;

  const unitTotal = items.filter((i) => i.kind === "unit").length;
  const completedCount = items.filter((i) => i.kind === "unit" && progress[i.key]?.completed).length;
  const totalMarks = Object.values(progress).reduce(
    (s, e) => s + Object.values(e.wordMarks ?? {}).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div>
      <section id="units" className="mx-auto mt-16 max-w-5xl scroll-mt-24 px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5fd3b3]">Choose a unit</p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-tight">
              Listen. Shadow. Speak.
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-4 py-2 font-medium text-[var(--muted)]">
              {completedCount}/{unitTotal} units done
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-4 py-2 font-medium text-[var(--muted)]">
              {totalMarks} word marks
            </span>
          </div>
        </div>
        <p className="mt-3 text-[15px]" style={{ color: "var(--muted)" }}>Real clips from shows, movies, and interviews — you watch, shadow, think in English, speak, and write without noticing the lesson.</p>

        <div className="mt-6 overflow-hidden rounded-full" style={{ backgroundColor: "var(--line)" }}>
          <div className="h-2 rounded-full bg-[#2ea88f] transition-all" style={{ width: `${unitTotal ? (completedCount / unitTotal) * 100 : 0}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[12px]" style={{ color: "var(--muted)" }}>
          <span>{level ?? "Level"} path · {unitTotal} scenes</span>
          <span>Finish scene {unitTotal} ready for the next level</span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const acc = accents[item.accent];
            const entry = progress[item.key] ?? defaultEntry;
            const isSelected = selected === item.key;
            const done = !!entry.completed;

            return (
              <button
                key={item.key}
                onClick={() => setSelected(item.key)}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border text-left transition hover:-translate-y-1 ${
                  isSelected ? "border-transparent ring-2" : "border-[var(--line)]"
                }`}
                style={{ backgroundColor: "var(--card)", ...(isSelected ? ({ ["--tw-ring-color" as string]: acc.solid } as React.CSSProperties) : {}) }}
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-85 transition group-hover:scale-[1.03] group-hover:opacity-100" loading="lazy" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: acc.solid }}>Scene {String(item.number).padStart(2, "0")}</span>
                  {done && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold text-white" style={{ backgroundColor: acc.solid }}>✓</span>}
                  <span className="absolute inset-0 grid place-items-center text-3xl text-white/90">▶</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold leading-snug">Real scene {item.number}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>Watch the clip, steal {6 + (item.number % 4)} real phrases, shadow, think, speak, and write.</p>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-[12px]" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
                    <span>{done ? "Completed" : entry.listens ? "Started" : "Not started"}</span>
                    <span className="font-bold" style={{ color: acc.text }}>Open →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {completedCount === unitTotal && unitTotal > 0 && (
          <div className="mt-8 rounded-3xl border p-7 text-center" style={{ borderColor: "var(--accent-line)", backgroundColor: "var(--accent-soft)" }}>
            <p className="text-[12px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--accent-text)" }}>Level complete</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">You finished all {unitTotal} scenes.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Before moving on, record the last speaking prompt again without notes. If your message is clear, you're ready.</p>
            {nextCourse && <Link href={nextCourse.href} className="mt-5 inline-flex rounded-full bg-[#2ea88f] px-5 py-3 text-sm font-bold text-white">Continue to {nextCourse.label} →</Link>}
          </div>
        )}
      </section>

      {selectedItem && (
        <section className="mx-auto mt-16 max-w-3xl scroll-mt-24 px-6">
          <UnitDetail
            item={selectedItem}
            entry={progress[selectedItem.key] ?? defaultEntry}
            onChange={(patch) => update(selectedItem.key, patch)}
            onClose={() => setSelected(null)}
          />
        </section>
      )}

      {loaded && Object.keys(progress).length === 0 && (
        <p className="sr-only">Progress is saved automatically to your browser session.</p>
      )}
    </div>
  );
}


