const steps = [
  { n: "01", phase: "2 MIN", title: "Listen once", body: "Listen for the situation and main idea. Don't stop for every new word. Your first job is understanding the message." },
  { n: "02", phase: "4 MIN", title: "Shadow short lines", body: "Play each short line, then copy it immediately. Match the American rhythm, reductions, stress, and pauses—not only individual sounds." },
  { n: "03", phase: "5 MIN", title: "Study the video", body: "Watch once for meaning. Watch again with English captions. Pick one clear 5–10 second line and shadow the actual speaker five times." },
  { n: "04", phase: "3 MIN", title: "Own useful chunks", body: "Listen to the phrase button, copy the example, then change one detail to make the sentence true for you. Mark each real use." },
  { n: "05", phase: "4 MIN", title: "Answer out loud", body: "Use the answer starter immediately. Give a short answer first, add one reason, then add one real example. Don't write a perfect script." },
  { n: "06", phase: "1 MIN", title: "Send a voice note", body: "Record one final answer on your phone. Listen once. Repeat only if your message wasn't clear. Clear communication beats perfect grammar." },
];

export default function MethodSection() {
  return (
    <section id="method" className="mx-auto mt-24 max-w-5xl px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5fd3b3]">The fast speaking routine</p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05]">Input that quickly becomes <span className="italic">your voice.</span></h2>
        <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">One short session. No word-by-word translation and no grammar test. Understand, imitate, personalize, then speak.</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <article key={s.n} className="rounded-3xl border border-[var(--line)] bg-[var(--paper-2)] p-7 shadow-[0_14px_34px_rgba(16,24,40,0.05)]">
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl font-semibold text-[#cbbfa6]">{s.n}</span>
              <span className="rounded-full bg-[#080a0d] px-3 py-1 text-[11px] font-semibold tracking-wide text-white">{s.phase}</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{s.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-[#080a0d] px-6 py-5 text-sm leading-relaxed text-[#e9e6dd]">
        <strong>Your answer formula:</strong> short answer → one reason → one example → one closing thought. Start speaking before you feel ready.
      </div>
    </section>
  );
}
