"use client";

/**
 * Vocabulary button for a word/expression.
 *
 * Opens YouGlish for that EXACT phrase in General American English (US),
 * URL-encoded correctly (works for multi-word phrases like "I was wondering").
 * It opens the official YouGlish page in a new tab, filtered to US English:
 *   https://youglish.com/pronounce/<encoded>/english/us
 *
 * It also notifies the in-app lab so the embedded widget search opens if the
 * lab drawer is already in use; the primary action is the direct YouGlish URL.
 */
export default function YouGlishButton({ phrase, size = "sm", accent = "var(--accent-text)" }: {
  phrase: string;
  size?: "sm" | "md";
  accent?: string;
}) {
  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const clean = phrase.trim();
    if (!clean) return;
    const url = `https://youglish.com/pronounce/${encodeURIComponent(clean)}/english/us`;
    // Open YouGlish for the exact phrase in US English.
    window.open(url, "_blank", "noopener,noreferrer");
    // Keep the in-app widget in sync for learners who prefer it.
    try { window.dispatchEvent(new CustomEvent("open-youglish", { detail: clean })); } catch { /* noop */ }
  };
  const dims = size === "md" ? "h-11 w-11" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={open}
      title={`Hear “${phrase}” in real American videos (YouGlish)`}
      aria-label={`Hear ${phrase} on YouGlish in American English`}
      className={`grid shrink-0 place-items-center rounded-full border transition active:scale-95 hover:border-[var(--accent-solid)] ${dims}`}
      style={{ borderColor: "var(--line)", backgroundColor: "var(--paper)", color: accent }}
    >
      {/* speaker icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}

/** Inline clickable word/phrase → YouGlish US English. */
export function YouGlishWord({ phrase, children }: { phrase: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        const clean = phrase.trim();
        if (clean) window.open(`https://youglish.com/pronounce/${encodeURIComponent(clean)}/english/us`, "_blank", "noopener,noreferrer");
      }}
      className="rounded px-0.5 underline decoration-dotted underline-offset-2 transition hover:bg-[var(--accent-soft)]"
      style={{ color: "var(--accent-text)", fontWeight: 600 }}
      title={`Hear “${phrase}” in real American videos`}
    >
      {children ?? phrase}
    </button>
  );
}
