export type LabChunk = { phrase: string; context: string; meaning: string };
export type LabLesson = {
  id: string;
  videoId: string;
  url: string;
  title: string;
  author: string;
  level: string;
  voice: string;
  thumbnail: string;
  transcript: string;
  chunks: LabChunk[];
  shadowLines: string[];
  questions: string[];
  answerFrames: string[];
  writingPrompt?: string;
  thinkPrompts?: string[];
  source?: string;
  needsTranscript?: boolean;
  translated?: boolean;
  timedSentences?: { text: string; start: number; end: number }[];
  language?: string;
  notice?: string;
};

const chunkMeanings: Array<[string, string]> = [
  ["you know what", "used before saying a new decision or thought"], ["I mean", "used to explain or correct what you just said"],
  ["to be honest", "used before a direct, honest opinion"], ["the thing is", "used to introduce the main problem or point"],
  ["at the end of the day", "when everything is considered"], ["it turns out", "used when the result was surprising"],
  ["I have no idea", "I really don't know"], ["I don't know", "used when you aren't sure"],
  ["kind of", "a little or in some way"], ["sort of", "a little or approximately"],
  ["a little bit", "a small amount"], ["pretty much", "almost completely or basically"],
  ["for some reason", "for a reason you don't know"], ["as a matter of fact", "used to add a true and often surprising detail"],
  ["by the way", "used to add a different or extra point"], ["speaking of", "used to connect to a related topic"],
  ["what do you mean", "ask someone to explain"], ["are you kidding", "show surprise or disbelief"],
  ["that makes sense", "I understand the reason"], ["sounds good", "I agree with that plan"],
  ["that's a good point", "show that someone's idea is reasonable"], ["I get it", "I understand"],
  ["no big deal", "not a serious problem"], ["no way", "show strong surprise or refusal"],
  ["come on", "urge someone or show disbelief"], ["hold on", "wait a moment"],
  ["hang on", "wait a moment"], ["give me a second", "wait for a short moment"],
  ["let me think", "give me time to find an answer"], ["let me see", "give me a moment to check or think"],
  ["what happened", "ask about an event"], ["what's going on", "ask what is happening"],
  ["what are you doing", "ask about someone's current action"], ["how did you", "ask about the way something happened"],
  ["I feel like", "used to share a feeling or personal impression"], ["I think that", "used to introduce an opinion"],
  ["I guess", "used for an unsure opinion"], ["I wonder", "used when thinking about a question"],
  ["I used to", "talk about a past habit or situation"], ["I'm used to", "say something is familiar now"],
  ["I was like", "common in stories before a reaction or quote"], ["and then", "move to the next event in a story"],
  ["all of a sudden", "suddenly"], ["right away", "immediately"],
  ["at first", "at the beginning"], ["in the end", "finally, after everything"],
  ["work out", "end successfully or find a solution"], ["figure out", "understand or solve"],
  ["find out", "discover information"], ["show up", "arrive or appear"],
  ["end up", "finally be in a situation"], ["pick up", "take, collect, or learn naturally"],
  ["go through", "experience something difficult or examine"], ["deal with", "handle a situation"],
  ["get over", "recover from something"], ["get along", "have a good relationship"],
  ["look forward to", "feel excited about a future event"], ["make sure", "check that something is true or done"],
  ["take care of", "look after or handle"], ["get rid of", "remove something"],
  ["a lot of", "many or much"], ["one of the", "one item from a group"],
  ["the first time", "the earliest occasion"], ["every once in a while", "sometimes, but not often"],
  ["it depends", "the answer changes with the situation"], ["it's up to you", "you can decide"],
  ["if you want", "used to make an offer less forceful"], ["as long as", "only if a condition is true"],
  ["even though", "despite the fact that"], ["rather than", "instead of"],
  ["not really", "a soft way to say no"], ["not at all", "completely not; also a polite response to thanks"],
  ["of course", "certainly; as expected"], ["for sure", "definitely"],
];

const clean = (text: string) => text.replace(/\[[^\]]*]/g, " ").replace(/\s+/g, " ").trim();
const sentences = (text: string) => clean(text).split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length >= 3);

export function voiceForLevel(level: string): string {
  return level === "A2" || level === "B2" || level === "C2" ? "andrew" : "ava";
}

export function framesForLevel(level: string): string[] {
  const frames: Record<string, string[]> = {
    A1: ["I see…", "At first…", "Then…", "In the end…"],
    A2: ["It starts when…", "At first… then…", "It's funny because…", "In the end…"],
    B1: ["What stood out was…", "I think the speaker meant…", "That reminds me of…", "I would probably…"],
    B2: ["The moment that matters is… because…", "There are two ways to see this…", "This connects to… because…", "If I were in that situation…"],
    C1: ["The speaker seems to assume…", "What's interesting is the subtext…", "I'd qualify that by saying…", "A broader implication is…"],
    C2: ["On the surface… yet beneath it…", "The implicit claim here is…", "I'd distinguish between… and…", "Paradoxically, this suggests…"],
  };
  return frames[level] ?? frames.B1;
}

export function analyzeTranscript(transcript: string, level: string): Pick<LabLesson, "chunks" | "shadowLines" | "questions" | "answerFrames"> {
  const text = clean(transcript);
  const lower = text.toLowerCase();
  const found: LabChunk[] = [];
  for (const [phrase, meaning] of chunkMeanings) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z])${escaped}(?![a-z])`, "i");
    const match = regex.exec(lower);
    if (!match) continue;
    const i = match.index + match[1].length;
    const context = sentences(text).find((s) => regex.test(s.toLowerCase())) ?? text.slice(Math.max(0, i - 35), i + phrase.length + 65);
    found.push({ phrase, meaning, context: context.slice(0, 180) });
    if (found.length >= (level === "A1" ? 5 : level === "A2" ? 7 : 10)) break;
  }

  // If a clip has few known chunks, select reusable 2–5 word frames from its clearest sentences.
  if (found.length < 5) {
    for (const sentence of sentences(text)) {
      const words = sentence.replace(/[^A-Za-z' ]/g, "").split(/\s+/).filter(Boolean);
      if (words.length < 4 || words.length > 18) continue;
      const phrase = words.slice(0, Math.min(5, words.length)).join(" ");
      if (!found.some((x) => x.phrase.toLowerCase() === phrase.toLowerCase())) {
        found.push({ phrase, context: sentence.slice(0, 180), meaning: "a reusable sentence opening from this clip" });
      }
      if (found.length >= 8) break;
    }
  }

  const maxWords = level === "A1" ? 8 : level === "A2" ? 11 : level === "B1" ? 15 : 20;
  let shadowLines = sentences(text).filter((s) => {
    const n = s.split(/\s+/).length;
    return n >= 4 && n <= maxWords && !/^\W*$/.test(s);
  }).slice(0, 4);
  if (shadowLines.length < 4) shadowLines = sentences(text).slice(0, 4);

  const time = level === "A1" ? "20 seconds" : level === "A2" ? "30 seconds" : level === "B1" ? "45 seconds" : "one minute";
  return {
    chunks: found,
    shadowLines,
    answerFrames: framesForLevel(level),
    questions: [
      "Who is speaking, and what is happening?",
      "What is one line or reaction you remember?",
      "Which chunk from this clip could you use in real life?",
      `Retell the moment or give your opinion for ${time}.`,
    ],
  };
}

export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] ?? null;
    return url.searchParams.get("v");
  } catch { return null; }
}
