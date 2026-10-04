import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { courseMap, courses } from "@/data/courses";
import BookExperience from "@/components/BookExperience";
import MethodSection from "@/components/MethodSection";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return courses.map((course) => ({ courseId: course.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId } = await params;
  const course = courseMap[courseId];
  if (!course) return {};
  return {
    title: `${course.level} ${course.name} — Read to Speak`,
    description: `${course.description} General American audio, video shadowing, and guided speaking practice.`,
  };
}

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = courseMap[courseId];
  if (!course) notFound();
  const courseIndex = courses.findIndex((item) => item.id === course.id);
  const next = courses[courseIndex + 1];

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] backdrop-blur" style={{ backgroundColor: "var(--header-bg)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg font-display text-base font-semibold" style={{ backgroundColor: "var(--mark-bg)", color: "var(--mark-fg)" }}>R</span>
            <span className="font-display text-lg font-semibold tracking-tight">Read to Speak</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] sm:gap-4">
            <Link href={`/learn/${course.id}#units`} className="hidden hover:text-[var(--ink)] sm:inline">Units</Link>
            <Link href="/think" className="hidden hover:text-[var(--ink)] sm:inline">Think</Link>
            <Link href={`/learn/${course.id}#method`} className="hidden hover:text-[var(--ink)] lg:inline">Method</Link>
            <Link href="/my-content" className="rounded-full px-3 py-1.5 font-semibold text-white" style={{ backgroundColor: "var(--accent-solid)" }}>My Content</Link>
            <Link href="/" className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-[var(--ink)]">{course.level} · Change</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="mx-auto mt-14 max-w-5xl px-6">
        <div className="flex flex-wrap items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>{course.level} — {course.name}</span>
          <span className="text-[var(--line-strong)]">·</span>
          <span>{course.range}</span>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 normal-case tracking-normal text-[var(--accent-text)]">General American</span>
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.02]">
          {course.tagline}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">{course.description}</p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-5 py-4 text-sm shadow-sm">
          <span className="grid h-8 w-8 place-items-center rounded-full font-bold" style={{ backgroundColor: "var(--mark-bg)", color: "var(--mark-fg)" }}>→</span>
          <span><strong>Speaking target:</strong> {course.outputTarget}</span>
        </div>
      </section>

      <BookExperience
        items={course.items}
        level={course.level}
        nextCourse={next ? { href: `/learn/${next.id}`, label: `${next.level} ${next.name}` } : undefined}
      />
      <MethodSection />

      <footer className="mx-auto mt-24 max-w-5xl border-t border-[var(--line)] px-6 pt-8 text-sm leading-relaxed text-[var(--muted)]">
        Natural General American audio · YouTube video practice · phrase-level pronunciation · progress saved automatically.
      </footer>
    </main>
  );
}
