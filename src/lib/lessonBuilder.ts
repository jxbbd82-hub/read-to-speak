import type { VocabItem } from "@/data/courses";

export type Cue = { t: number; d: number; text: string };

export type SegmentLesson = {
  title: string;
  author: string;
  start: number;
  passage: string;
  chunks: VocabItem[];
  shadows: string[];
  questions: string[];
  frames: string[];
  writingPrompt: string;
  thinkPrompts: string[];
  wordCount: number;
  challenge?: string;
};

const CHUNKS: Array<[string, string]> = [
  ["you know what", "used before a new decision or thought"], ["i mean", "used to explain or correct yourself"], ["to be honest", "before a direct, honest opinion"],
  ["the thing is", "introduce the main point or problem"], ["at the end of the day", "when everything is considered"], ["it turns out", "the result was surprising"],
  ["i have no idea", "i really don't know"], ["kind of", "a little; in some way"], ["sort of", "a little; approximately"], ["a little bit", "a small amount"],
  ["pretty much", "almost completely; basically"], ["for some reason", "for an unknown reason"], ["by the way", "add an extra point"], ["speaking of", "connect to a related topic"],
  ["what do you mean", "ask someone to explain"], ["are you kidding", "show surprise or disbelief"], ["that makes sense", "i understand the reason"], ["sounds good", "i agree with the plan"],
  ["that's a good point", "someone's idea is reasonable"], ["i get it", "i understand"], ["no big deal", "not a serious problem"], ["no way", "strong surprise or refusal"],
  ["come on", "urge someone or show disbelief"], ["hold on", "wait a moment"], ["hang on", "wait a moment"], ["give me a second", "wait a short moment"],
  ["let me think", "give me a moment to answer"], ["let me see", "give me a moment to check"], ["what's going on", "ask what is happening"],
  ["i feel like", "share a feeling or impression"], ["i guess", "an unsure opinion"], ["i wonder", "think about a question"], ["i used to", "a past habit or situation"],
  ["i was like", "introduce a reaction or quote in a story"], ["all of a sudden", "suddenly"], ["right away", "immediately"], ["at first", "at the beginning"],
  ["in the end", "finally; after everything"], ["work out", "end successfully; find a solution"], ["figure out", "understand or solve"], ["find out", "discover"],
  ["show up", "arrive or appear"], ["end up", "finally be in a situation"], ["deal with", "handle a situation"], ["get over", "recover from something"],
  ["get along", "have a good relationship"], ["look forward to", "feel excited about something ahead"], ["make sure", "check that something is done"],
  ["take care of", "look after; handle"], ["get rid of", "remove something"], ["it depends", "the answer changes with the situation"], ["it's up to you", "you decide"],
  ["as long as", "only if a condition is true"], ["even though", "despite the fact that"], ["rather than", "instead of"], ["not really", "a soft way to say no"],
  ["of course", "certainly; as expected"], ["for sure", "definitely"], ["what happened", "ask about an event"], ["how did you", "ask the way something happened"],
  ["are you serious", "show surprised disbelief"], ["i can't believe", "show strong surprise"], ["check it out", "go see or try something"], ["take it easy", "relax; go slowly"],
  ["hang out", "spend relaxed time together"], ["sleep in", "wake up later than usual"], ["my bad", "casual apology for my mistake"], ["got it", "i understand"],
  ["here you go", "said when giving something"], ["no worries", "it's okay; don't worry"], ["sounds like", "it seems to be the case"], ["i'm just saying", "soften an opinion"],
  ["actually", "in fact; used to correct or add"], ["honestly", "before a frank opinion"], ["let's", "suggest doing something together"], ["you guys", "casual way to address people"],
  ["gonna", "going to — fast American speech"], ["wanna", "want to — fast American speech"], ["gotta", "have got to; must"], ["kinda", "kind of"],
];

export const CFG: Record<string, { words: number; shadows: number; chunks: number; maxSent: number }> = {
  A1: { words: 80, shadows: 4, chunks: 6, maxSent: 9 },
  A2: { words: 110, shadows: 5, chunks: 7, maxSent: 13 },
  B1: { words: 150, shadows: 6, chunks: 8, maxSent: 18 },
  B2: { words: 185, shadows: 6, chunks: 8, maxSent: 24 },
  C1: { words: 220, shadows: 7, chunks: 9, maxSent: 30 },
  C2: { words: 255, shadows: 8, chunks: 10, maxSent: 40 },
};

export const FRAMES: Record<string, string[]> = {
  A1: ["I see…", "At first…", "Then…", "In the end…"],
  A2: ["It starts when…", "At first… then…", "It's funny because…", "In the end…"],
  B1: ["What stood out was…", "I think they meant…", "That reminds me of…", "I would probably…"],
  B2: ["The moment that matters is… because…", "There are two ways to see this…", "This connects to… because…", "If I were in that situation…"],
  C1: ["The speaker seems to assume…", "What's interesting is the subtext…", "I'd qualify that by saying…", "A broader implication is…"],
  C2: ["On the surface… yet beneath it…", "The implicit claim here is…", "I'd distinguish between… and…", "Paradoxically, this suggests…"],
};

const WRITE: Record<string, string> = {
  A1: "Write 3 simple sentences retelling the scene, then one sentence about yourself.",
  A2: "Write 5 sentences: what happened, the funny moment, and your reaction.",
  B1: "Write a 60-word paragraph retelling the scene, then change one detail to make it your story.",
  B2: "Write 90 words: a 2-sentence summary, an interpretation, and a personal comparison.",
  C1: "Write 120 words analyzing one speaker's choices and implied meaning.",
  C2: "Write 150 words arguing an interpretation, including a counterpoint.",
};

const THINK: Record<string, string[]> = {
  A1: ["Name three things you see in the scene, in English.", "Narrate in your head: First… Then… Next…", "Think what you would say — the simple version."],
  A2: ["Describe the scene in three short English sentences in your head.", "When a word is missing, think of a simpler way to say it.", "Replay the funniest moment and describe it to yourself in English."],
  B1: ["Narrate what happens without translating from your language.", "Predict the next line in English before they say it.", "Turn one line into a sentence about your own life."],
  B2: ["Summarize each person's point silently in English.", "Notice one repeated phrase; think when you'd use it.", "Argue the opposite side of the scene in your head."],
  C1: ["Infer what each speaker wants but doesn't say.", "Restate the subtext of one exchange in your own words.", "Think of a counterexample to the speaker's assumption."],
  C2: ["Identify the unstated assumption behind the humor.", "Reformulate the scene in a different register in your head.", "Connect the moment to a broader social pattern."],
};

export const splitSentences = (text: string) =>
  text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 2) ?? [];

// Give each fall-back starter a meaning that reflects what it actually does,
// so meanings never repeat across the chunks of one lesson.
function functionLabel(sentence: string): string {
  const s = sentence.trim();
  const lower = s.toLowerCase();
  if (/^(what|who|where|when|why|how|do you|did you|are you|can you|is it|is there)\b/.test(lower))
    return "ask a question — use this to open or check something";
  if (/^(yes|yeah|yep|sure|of course|okay|ok|right|exactly|totally|absolutely)\b/.test(lower))
    return "agree or confirm in a casual, natural way";
  if (/^(no|nope|nah|never|not really|i don'?t|i can'?t)\b/.test(lower))
    return "refuse or disagree softly without sounding rude";
  if (/^(sorry|my bad|excuse me|apolog)/i.test(lower))
    return "apologize or recover from a small mistake";
  if (/^(thanks|thank you|appreciate)\b/.test(lower))
    return "thank someone in everyday speech";
  if (/^(hi|hey|hello|yo|morning|good (morning|afternoon|evening))\b/.test(lower))
    return "greet someone and start a conversation";
  if (/^(bye|goodbye|see you|see ya|later|good night)\b/.test(lower))
    return "close a conversation naturally";
  if (/^(wait|hold on|hang on|give me|let me)\b/.test(lower))
    return "pause or buy a moment to think";
  if (/^(because|so|since|therefore|that'?s why)\b/.test(lower))
    return "give a reason or explain why";
  if (/^(then|after|next|later|finally|in the end|at first)\b/.test(lower))
    return "move a story forward in time";
  if (/^(but|however|although|even though|though)\b/.test(lower))
    return "contrast two ideas or add a turn";
  if (/^(if|when|unless|as long as)\b/.test(lower))
    return "set a condition before the main idea";
  if (/^(i think|i feel|i guess|i mean|honestly|to be honest)\b/.test(lower))
    return "share a personal opinion or soften a statement";
  if (/^(i'?m|i am|i was|i'?ve|i have)\b/.test(lower))
    return "tell something about yourself or your reaction";
  if (/^(you|we|they|he|she|it)'?r?e? ?/.test(lower))
    return "comment on someone or describe what happened";
  if (/^(look|listen|watch|come on|let'?s)\b/.test(lower))
    return "direct attention or suggest doing something together";
  return "react or keep the conversation going in your own words";
}

function buildChunks(text: string, level: string): VocabItem[] {
  const cfg = CFG[level] ?? CFG.B1;
  const lower = text.toLowerCase();
  const sents = splitSentences(text);
  const out: VocabItem[] = [];
  for (const [phrase, meaning] of CHUNKS) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(^|[^a-z])${esc}(?![a-z])`, "i");
    const mm = rx.exec(lower);
    if (!mm) continue;
    const ctx = sents.find((x) => rx.test(x.toLowerCase())) ?? text.slice(Math.max(0, mm.index - 30), mm.index + phrase.length + 70);
    out.push({ word: phrase, part_of_speech: "spoken chunk", meaning, example: ctx.slice(0, 170) });
    if (out.length >= cfg.chunks) break;
  }
  const clean = (s: string) => !/[A-Z]{3,}/.test(s) && (s.match(/[a-z]/g) ?? []).length > s.replace(/[a-z]/g, "").length;
  const usedMeanings = new Set(out.map((x) => x.meaning));
  if (out.length < cfg.chunks) {
    for (const s of sents) {
      if (!clean(s)) continue;
      const word = s.split(/\s+/).slice(0, 5).join(" ").replace(/[.,;:]+$/, "");
      if (word.split(/\s+/).length < 3) continue;
      const meaning = functionLabel(s);
      if (out.some((x) => x.word.toLowerCase() === word.toLowerCase())) continue;
      // Never repeat the same functional meaning twice in one lesson.
      if (usedMeanings.has(meaning)) continue;
      usedMeanings.add(meaning);
      out.push({ word, part_of_speech: "sentence starter", meaning, example: s.slice(0, 170) });
      if (out.length >= cfg.chunks) break;
    }
  }
  return out;
}

function pickShadows(cues: Cue[], level: string): string[] {
  const cfg = CFG[level] ?? CFG.B1;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cues) {
    const n = c.text.split(/\s+/).length;
    if (n < 3 || n > cfg.maxSent) continue;
    const key = c.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c.text);
    if (out.length >= cfg.shadows) break;
  }
  return out.slice(0, cfg.shadows);
}

export function splitSegments(cues: Cue[], level: string): { start: number; cues: Cue[] }[] {
  const cfg = CFG[level] ?? CFG.B1;
  const result: { start: number; cues: Cue[] }[] = [];
  let bucket: Cue[] = [];
  let words = 0;
  let start = cues[0]?.t ?? 0;
  for (const c of cues) {
    if (!bucket.length) start = c.t;
    bucket.push(c);
    words += c.text.split(/\s+/).length;
    const done = (words >= cfg.words && /[.!?]$/.test(c.text.trim())) || words >= cfg.words * 1.35;
    if (done) { result.push({ start, cues: bucket }); bucket = []; words = 0; }
  }
  if (bucket.length && bucket.join(" ").split(/\s+/).length >= cfg.words * 0.55) result.push({ start, cues: bucket });
  // merge a tiny tail into the previous segment
  if (result.length > 1) {
    const last = result[result.length - 1];
    const prev = result[result.length - 2];
    if (last.cues.join(" ").split(/\s+/).length < cfg.words * 0.55) { prev.cues.push(...last.cues); result.pop(); }
  }
  return result;
}

export function buildSegment(cues: Cue[], level: string, segIndex: number, meta: { title: string; author: string }): SegmentLesson {
  const segments = splitSegments(cues, level);
  const seg = segments[Math.min(segIndex, segments.length - 1)] ?? { start: 0, cues };
  const text = seg.cues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
  return {
    title: meta.title,
    author: meta.author,
    start: Math.floor(seg.start / 1000),
    passage: text,
    chunks: buildChunks(text, level),
    shadows: pickShadows(seg.cues, level),
    questions: [
      "Who is in this scene, and what actually happens?",
      "What is the funniest or most surprising moment, and why?",
      "Which phrase from the scene would you use in real life, and when?",
      level === "A1" || level === "A2" ? "Retell the scene out loud in your own words." : "How would this same scene go in your country or your life?",
    ],
    frames: FRAMES[level] ?? FRAMES.B1,
    writingPrompt: WRITE[level] ?? WRITE.B1,
    thinkPrompts: THINK[level] ?? THINK.B1,
    wordCount: text.split(/\s+/).length,
  };
}

export function segmentCount(cues: Cue[], level: string): number {
  return splitSegments(cues, level).length;
}

// MY CONTENT specialization: speaking chunks that help a B1-listening /
// A2-speaking designer lead client calls and present work. These are
// multi-word ways to build speech, not isolated vocabulary.
export const CLIENT_CHUNKS: Array<[string, string]> = [
  ["i'm leaning towards", "state the option you prefer, without sounding final"],
  ["the main reason is", "introduce the key reason behind a decision"],
  ["what i'm trying to achieve is", "explain the goal before the solution"],
  ["i'd suggest", "recommend something politely"],
  ["let me walk you through it", "invite the client to follow your explanation"],
  ["the reason i went this direction is", "justify a design choice"],
  ["what do you think about", "ask for an opinion on a specific idea"],
  ["we could try", "offer an option or alternative gently"],
  ["i'd be happy to revise that", "accept feedback professionally"],
  ["let's go back to the brief", "refocus a conversation on the agreed goals"],
  ["just to clarify", "check that you understood correctly"],
  ["so what you're saying is", "repeat the client's point to confirm it"],
  ["that makes sense", "acknowledge an idea or concern"],
  ["i see what you mean", "show you understand their feedback"],
  ["what if we", "propose a compromise or experiment"],
  ["to keep it simple", "explain why a cleaner option works better"],
  ["it comes down to", "reduce a decision to its main point"],
  ["from your audience's point of view", "explain a choice through the end user"],
  ["i'll send that over by", "promise a delivery time clearly"],
  ["can we align on", "ask everyone to agree on one thing"],
  ["my process usually starts with", "explain how you work"],
  ["i wanted to understand", "ask about the client's situation"],
  ["the concept is built around", "introduce the core idea of a design"],
  ["i'll note that and come back with", "acknowledge feedback and set the next step"],
];

export type MyContentSpec = {
  focus: string;
  category: "Everyday" | "Work" | "Design";
};

// Split cues into short ~word windows so repeated use of one video still
// produces distinct, deep-practice lessons (not the whole long transcript).
export function sliceCuesByOccurrence(cues: Cue[], occurrence: number, targetWords = 175): Cue[] {
  if (occurrence <= 0) return cues;
  const totalWords = cues.reduce((n, c) => n + c.text.split(/\s+/).length, 0);
  // A short 3–6 minute lesson should stay whole so every repetition is rich;
  // only genuinely long videos are split.
  if (totalWords <= targetWords * 2.2 || cues.length <= 16) return cues;
  // Build balanced, non-overlapping windows so the last one is never tiny.
  const windowCount = Math.max(1, Math.round(totalWords / targetWords));
  const size = Math.ceil(cues.length / windowCount);
  const windows: Cue[][] = [];
  for (let i = 0; i < cues.length; i += size) windows.push(cues.slice(i, i + size));
  const chosen = windows[Math.min(occurrence - 1, windows.length - 1)] ?? cues;
  return chosen;
}

// A single, short lesson tuned for speaking output.
export function buildMyContentLesson(
  cues: Cue[],
  level: string,
  meta: { title: string; author: string },
  spec: MyContentSpec,
  start = 0,
  occurrence = 0,
): SegmentLesson {
  const base = "B1";
  const windowed = sliceCuesByOccurrence(cues, occurrence);
  const text = windowed.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
  // Search the WHOLE video for phrases so a short window still yields enough
  // usable chunks; examples stay natural and shadows stay within the window.
  const fullText = cues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
  const sourceForChunks = fullText || text;
  // Prefer client/speaking chunks for work/design lessons; otherwise the
  // everyday chunk family already present in buildChunks.
  const everyday = buildChunks(sourceForChunks, level);
  let chunks = everyday;
  if (spec.category !== "Everyday") {
    const lower = sourceForChunks.toLowerCase();
    const sents = splitSentences(sourceForChunks);
    const found: VocabItem[] = [];
    const chosen = new Set<string>();
    const scan = [...CLIENT_CHUNKS];
    for (const [phrase, meaning] of scan) {
      if (found.length >= 8) break;
      const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(`(^|[^a-z])${esc}(?![a-z])`, "i");
      const mm = rx.exec(lower);
      if (!mm || chosen.has(phrase)) continue;
      chosen.add(phrase);
      const ctx = sents.find((s) => rx.test(s.toLowerCase())) ?? text.slice(Math.max(0, mm.index - 30), mm.index + phrase.length + 80);
      found.push({ word: phrase, part_of_speech: "speaking chunk", meaning, example: ctx.slice(0, 170) });
    }
    // Top up with everyday chunks so a lesson always has usable phrases.
    for (const c of everyday) {
      if (found.length >= 8) break;
      if (!found.some((f) => f.word.toLowerCase() === c.word.toLowerCase())) found.push(c);
    }
    chunks = found;
  }
  // Guarantee at least 6 phrases even in a short section. Pull functional
  // sentence starters from the window first, then the full video, always with
  // unique meanings so no two chunks in a lesson say the same thing.
  if (chunks.length < 6) {
    const usedWords = new Set(chunks.map((c) => c.word.toLowerCase()));
    const clean = (s: string) => !/[A-Z]{3,}/.test(s) && (s.match(/[a-z]/g) ?? []).length > s.replace(/[a-z]/g, "").length;
    const candidates = [...splitSentences(text), ...splitSentences(fullText || text)];
    for (const s of candidates) {
      if (chunks.length >= 6) break;
      if (!clean(s)) continue;
      const word = s.split(/\s+/).slice(0, 5).join(" ").replace(/[.,;:]+$/, "");
      if (word.split(/\s+/).length < 3) continue;
      const meaning = functionLabel(s);
      const key = word.toLowerCase();
      // Only the phrase text must be unique; functional meanings may repeat
      // across genuinely different starters.
      if (usedWords.has(key)) continue;
      usedWords.add(key);
      chunks.push({ word, part_of_speech: "speaking starter", meaning: `${meaning}`, example: s.slice(0, 170) });
    }
  }

  const frames = ["The main idea is…", "I'd say this because…", "In my own situation…", "With a client, I would…"];
  const think = [
    "Describe what is happening in three short English sentences.",
    "If you don't know a word, say the same idea in a simpler way — don't switch to Arabic.",
    spec.category === "Everyday"
      ? "Imagine telling a friend about this in English."
      : "Imagine you are on a client call. What would you say next?",
  ];
  const questions =
    spec.category === "Everyday"
      ? [
          "What happens, and what does the speaker do or feel?",
          "Have you experienced something similar? What did you do?",
          "Which phrase from the video would you use this week, and when?",
          "Retell the moment in your own words.",
        ]
      : [
          "What is the speaker trying to explain or achieve?",
          "How would you explain the same idea to one of your clients?",
          "What would the client probably ask next, and how would you answer?",
          "Which phrase helps you sound natural and professional in a meeting?",
        ];
  const write =
    spec.category === "Everyday"
      ? "Write 5 sentences: what happened, one detail, and how it connects to your own life."
      : "Write how you would explain this idea to a client in 5–6 short, friendly sentences.";

  // Six short shadow lines, from the window; use the full video if a window
  // is too short to provide enough.
  let shadows = pickShadows(windowed, base);
  if (shadows.length < 6) {
    const fallback = pickShadows(cues, base);
    shadows = fallback.length >= 6 ? fallback : pickShadows(cues, "B2");
  }

  return {
    title: meta.title,
    author: meta.author,
    start,
    passage: text,
    chunks,
    shadows,
    questions,
    frames,
    writingPrompt: write,
    thinkPrompts: think,
    wordCount: text.split(/\s+/).length,
    challenge: spec.focus,
  };
}

// Build a complete scene lesson from a plain transcript (used for any
// pasted/YouTube video). Turns cues out of the text by sentence timestamps.
export function buildFromTranscript(transcript: string, level: string, meta: { title: string; author?: string; start?: number }): SegmentLesson {
  const sentences = splitSentences(transcript);
  let acc = 0;
  const cues: Cue[] = sentences.map((text, i) => {
    const words = text.split(/\s+/).length;
    const cue: Cue = { t: acc, d: words * 420, text };
    acc += words * 420;
    void i;
    return cue;
  });
  const seg = buildSegment(cues, level, 0, { title: meta.title, author: meta.author ?? "YouTube" });
  seg.start = meta.start ?? 0;
  seg.passage = transcript.slice(0, 6000);
  return seg;
}
