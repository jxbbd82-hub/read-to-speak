import Link from "next/link";
import { courses } from "@/data/courses";
import ThemeToggle from "@/components/ThemeToggle";

const META: Record<string, { purpose: string; difficulty: string; outcome: string; lessons: number }> = {
  "a1": { purpose: "Understand very simple, slow exchanges", difficulty: "Beginner", outcome: "Say short sentences about a scene", lessons: 6 },
  "a2": { purpose: "Follow easy daily conversations", difficulty: "Elementary", outcome: "Retell a moment and react", lessons: 6 },
  "b1-core": { purpose: "Understand real, slightly challenging speech", difficulty: "Pre-intermediate", outcome: "Explain an idea for 45–60s", lessons: 6 },
  "b2": { purpose: "Follow opinions, interviews and arguments", difficulty: "Intermediate", outcome: "Compare and justify a view", lessons: 7 },
  "c1": { purpose: "Catch nuance, subtext and abstract ideas", difficulty: "Upper", outcome: "Analyse a talk for one minute", lessons: 7 },
  "c2": { purpose: "Follow dense, nuanced professional talk", difficulty: "Advanced", outcome: "Build a precise, qualified argument", lessons: 6 },
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-6 sm:pt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#10231d] font-display text-base font-semibold text-[#f6f4ee]">R</span>
          <span className="font-display text-lg font-semibold tracking-tight">Read to Speak</span>
        </div>
        <nav className="flex items-center gap-3 text-sm font-medium text-[var(--muted)] sm:gap-4">
          <Link href="/think" className="hidden sm:inline">Think</Link>
          <Link href="/my-content" className="font-semibold text-[var(--accent-text)]">My track</Link>
          <ThemeToggle />
        </nav>
      </div>

      {/* Hero — one clear action */}
      <section className="mt-14 sm:mt-20">
        <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[var(--accent-text)]">Speak real English</p>
        <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,6vw,3.6rem)] font-semibold leading-[1.04] tracking-tight">
          Watch a short clip. Then actually <em className="text-[var(--accent-text)]">talk.</em>
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[var(--muted)]">
          Real scenes turned into guided speaking practice — shadow, steal phrases, build answers, and talk out loud. Choose the level you want to <strong className="text-[var(--ink)]">speak</strong>.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/my-content" className="rounded-full bg-[var(--accent-solid)] px-6 py-3 text-[15px] font-bold text-white transition ">Start practicing →</Link>
          <Link href="/learn/b1-core" className="rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-6 py-3 text-[15px] font-semibold text-[var(--ink)] transition hover:border-[#1d6f5b]">Browse levels</Link>
        </div>
        {courses.some((c) => c.id === "b1-core") && (
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
            Understand B1 but speak closer to A2? <Link href="/learn/b1-core" className="font-semibold text-[var(--accent-text)] underline underline-offset-2">B1 Speak Up Core</Link> keeps input understandable while the starters lift your speaking.
          </p>
        )}
      </section>

      {/* Personal 3-month track */}
      <Link href="/my-content" className="mt-14 block rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Personal curriculum · 12 weeks</p>
            <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">My 3-month speaking track</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--muted)] sm:text-[14px]">
              Clean, real short clips that move from everyday talk to client and design conversations.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--line-strong)] px-4 py-2 text-[13px] font-bold text-[var(--ink)]">Open →</span>
        </div>
      </Link>

      {/* Levels — concise, informative */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Levels</h2>
          <span className="text-[13px] text-[var(--muted)]">Finish one, then move up</span>
        </div>
        <div className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-card)]">
          {courses.map((c) => {
            const m = META[c.id] ?? { purpose: "", difficulty: "", outcome: "", lessons: 6 };
            const recommended = c.id === "b1-core";
            return (
              <Link key={c.id} href={`/learn/${c.id}`} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--accent-soft)]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#10231d] text-[13px] font-bold text-[#f6f4ee]">{c.level}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{c.name}</span>
                    {recommended && <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-text)]">Recommended</span>}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">{m.purpose} · <span className="italic">{m.outcome}</span></p>
                </div>
                <span className="hidden shrink-0 text-right text-[12px] text-[var(--muted)] sm:block">{m.lessons} lessons<br />{m.difficulty}</span>
                <span className="shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-text)]">→</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Think */}
      <Link href="/think" className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 sm:p-6">
        <div>
          <h2 className="font-display text-lg font-semibold sm:text-xl">Think in English</h2>
          <p className="mt-1 max-w-xl text-[13px] text-[var(--muted)] sm:text-[14px]">Five minutes of micro-thoughts so you stop translating and start forming sentences directly.</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--line-strong)] px-4 py-2 text-[13px] font-bold">Open →</span>
      </Link>

      <footer className="mt-16 border-t border-[var(--line)] pt-6 text-[12px] text-[var(--muted)]">
        Real clips · General American practice voice · original speakers kept in every video · no account needed.
      </footer>
    </main>
  );
}
