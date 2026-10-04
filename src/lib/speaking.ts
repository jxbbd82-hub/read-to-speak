import type { VocabItem } from "@/data/courses";

export type Rung = { label: string; starter: string; seconds: string };

const CLIENT_HINT = /client|brand|design|brief|revision|feedback|meeting|price|deadline|scope/i;

export function isClientContext(topic = "", passage = "", challenge = "") {
  return CLIENT_HINT.test(`${topic} ${passage} ${challenge}`);
}

/** A clean usable phrase from the chunk list (prefer spoken chunks). */
function topPhrases(chunks: VocabItem[], n = 3): string[] {
  return chunks.slice(0, n).map((c) => c.word);
}

/** Five-rung speaking ladder derived from the lesson, so the learner is
 *  never asked to create language from nothing. */
export function buildLadder(opts: {
  chunks: VocabItem[];
  question: string;
  client: boolean;
}): Rung[] {
  const phrase = topPhrases(opts.chunks, 1)[0] ?? "I think";
  return [
    { label: "Complete the idea", starter: `The main idea is`, seconds: "5–10s" },
    { label: "Make it yours", starter: `The main idea ${phrase.includes(" ") ? `is ${phrase}` : "for me"} is`, seconds: "10s" },
    { label: "Personalize", starter: opts.client
      ? "In my work with a client, this matters because"
      : "In my own life, this matters because", seconds: "10–15s" },
    { label: "Respond", starter: opts.client
      ? "If a client asked me about this, I'd say"
      : "If someone asked me about this, I'd say", seconds: "15–20s" },
    { label: "Speak freely", starter: opts.question, seconds: "30–60s" },
  ];
}

/** Build-Your-Answer stems (expanding one answer). */
export function buildStems(question: string, chunks: VocabItem[]): string[] {
  const p = topPhrases(chunks, 2);
  return [
    "I think",
    p[0] ? `I think ${p[0]}` : "I think it's",
    p[0] ? `I think ${p[0]}, because` : "I think so, because",
    `I think ${p[0] ? `${p[0]},` : ""} because… For example,`,
    "Now say the complete answer in your own words",
  ];
}

/** Tiny production tasks for "Think in English" (finish / change / personalize). */
export function thinkTasks(passage: string, client: boolean): string[] {
  const first = passage.split(/(?<=[.!?])\s+/)[0]?.slice(0, 90) ?? "this moment";
  return [
    `Finish: “The speaker is talking about…”`,
    `Change one detail: “If this happened to me, I would…”`,
    client ? `Personalize: “In my work, I would…”` : `Personalize: “In my week, I…`,
  ];
}

/** Prepared challenge materials. */
export function challengePrep(chunks: VocabItem[], frames: string[], passage: string, client: boolean) {
  const phrases = topPhrases(chunks, 3);
  const starters = frames.length ? frames.slice(0, 2) : ["The main reason is…", "I'd suggest…"];
  const sents = passage.split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length >= 5 && s.split(/\s+/).length <= 16);
  const ideas = sents.slice(0, 2).map((s) => s.replace(/[“"]/g, "").slice(0, 80));
  const personal = client
    ? "How would this help you on a real client call?"
    : "When could you use this in your own life?";
  return { phrases, starters, ideas: ideas.length ? ideas : ["Mention one detail from the clip.", "Connect it to your own experience."], personalQuestion: personal };
}
