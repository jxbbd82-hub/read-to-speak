import Link from "next/link";
import { courses } from "@/data/courses";

const colors = ["#31806f", "#d07b32", "#4a4978", "#36738e", "#875984", "#393846"];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#080a0d] font-display text-lg font-semibold text-white">R</div>
        <span className="font-display text-xl font-semibold tracking-tight">Read to Speak</span>
      </header>

      <section className="mt-16 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5fd3b3]">Choose your level · A1 to C2</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.02]">Stop studying English. Start using it.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
          Natural General American audio, short shadowing drills, useful spoken chunks, real videos, and guided answers. Pick the level you want to <em>speak</em>—not only the level you understand.
        </p>
        <div className="mt-6 rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4 text-[14px] leading-relaxed text-[var(--ink)]">
          <strong>Quick level tip:</strong> If you understand B1 but speak at A2, choose <strong>B1 Speak Up Core</strong>. Its input is easy B1, while the answer starters help you move your speaking up from A2.
        </div>
        <div className="mt-8">
          <Link href="/my-content" className="group flex items-center justify-between gap-4 rounded-3xl border border-[#c14b3d]/40 bg-gradient-to-br from-[#2a1411] to-[var(--card)] p-6 transition hover:-translate-y-0.5">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[.18em] text-[#e88a7d]">Your personal track</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">MY CONTENT</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Real videos picked for you — everyday English, freelancing, and design/client calls — turned into the same speak-first lessons. Built for B1 understanding moving your speaking up from A2.</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#c14b3d] px-5 py-3 text-sm font-bold text-white">Open →</span>
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => (
          <Link key={course.id} href={`/learn/${course.id}`} className="group relative flex h-full flex-col rounded-3xl border border-transparent bg-[var(--paper-2)] p-7 shadow-[0_18px_40px_rgba(16,24,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(16,24,40,0.10)]">
            <div className="flex items-center justify-between">
              <span className="inline-flex min-w-11 items-center justify-center rounded-full px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: colors[index] }}>{course.level}</span>
              {course.id === "b1-core" && <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[#5fd3b3]">Recommended</span>}
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">{course.name}</h2>
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">{course.range}</p>
            <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--muted)]">{course.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors[index] }}>Start speaking <span aria-hidden>→</span></span>
          </Link>
        ))}
      </section>

      <div className="mt-12 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6">
        <h2 className="font-display text-2xl font-semibold">Think in English — 5 minutes a day</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Train the inner voice itself: micro-thoughts, narrating what you do, small decisions, and going around missing words — so you stop translating and start speaking.
        </p>
        <Link href="/think" className="mt-4 inline-block rounded-full bg-[#2ea88f] px-5 py-3 text-sm font-bold text-white">Start the daily drill →</Link>
      </div>

      <footer className="mt-20 border-t border-[var(--line)] pt-8 text-sm text-[var(--muted)]">
        Six CEFR levels · General American voices · real clips · writing & thinking trainers · no account needed.
      </footer>
    </main>
  );
}
