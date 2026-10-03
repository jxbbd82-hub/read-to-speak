import { levelVideos, unitsForLevel, LEVELS } from "./manifest";

export type VocabItem = {
  word: string;
  part_of_speech: string;
  meaning: string;
  example: string;
};

export type LearningItem = {
  key: string;
  legacyKey?: string;
  kind: "unit";
  number: number;
  level: string;
  source: "video";
  title: string;
  topic: string;
  grammar: string;
  grammarNote: string;
  duration: string | null;
  accent: "emerald" | "apricot" | "ink";
  passage: string[];
  vocabulary: VocabItem[];
  speakingPrompts: string[];
  answerFrames: string[];
  shadowLines: string[];
  summary: string;
  voice: "ava" | "andrew" | "emma";
  videoId: string;
  seg: number;
  videoStart?: number;
  channel?: string;
  writingPrompt?: string;
  thinkPrompts?: string[];
};

export type Course = {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  name: string;
  range: string;
  tagline: string;
  description: string;
  outputTarget: string;
  items: LearningItem[];
};

const META = {
  A1: { level: "A1", id: "a1", name: "First Conversations", tagline: "Start speaking today.", description: "Twelve simple, funny scenes from kids' shows and animation. Understand easy talk, copy real lines, and answer without translating.", outputTarget: "Handle a simple 20-second exchange — the base for A2." },
  A2: { level: "A2", id: "a2", name: "Everyday Speaking", tagline: "Connect simple ideas.", description: "Animated movie scenes full of everyday reactions, plans, and short stories you can retell.", outputTarget: "Tell a clear 30-second story with a reaction and result — ready for B1." },
  B1: { level: "B1", id: "b1-core", name: "Speak Up Core", tagline: "Move from A2 speech to B1 confidence.", description: "Game shows, family comedy, and light interviews. Steal real phrases, shadow native timing, and speak for a full minute.", outputTarget: "Speak 45–60 seconds without translating every sentence — ready for B2." },
  B2: { level: "B2", id: "b2", name: "Clear & Confident", tagline: "Explain and support your ideas.", description: "Storytelling interviews and comedy scenes with richer reactions, opinions, and subtext.", outputTarget: "Give a one-minute opinion with reasons and examples — ready for C1." },
  C1: { level: "C1", id: "c1", name: "Nuanced Speaking", tagline: "Think clearly out loud.", description: "Fast, layered talk shows and ideas worth interpreting. Practice reading between the lines.", outputTarget: "Deliver a nuanced one-minute interpretation — ready for C2." },
  C2: { level: "C2", id: "c2", name: "Precision & Rhetoric", tagline: "Handle complexity with control.", description: "Dense wordplay, satire, and argument. Follow rapid turns and build precise counterpoints.", outputTarget: "Sustain a precise 90-second argument from more than one angle." },
} as const;

const ACCENTS = ["emerald", "apricot", "ink"] as const;
const SPEAK = {
  A1: "Retell the scene in 20 seconds with simple sentences.",
  A2: "Retell it in 30 seconds, then give one personal reaction.",
  B1: "Retell the scene and react for 45–60 seconds.",
  B2: "Retell, interpret, and compare for one minute.",
  C1: "Analyze the scene and its subtext for one minute.",
  C2: "Build a nuanced 90-second interpretation.",
};

function makeItems(level: string): LearningItem[] {
  return unitsForLevel(level).map((u, i) => ({
    // Stable key tied to the actual video+scene, so progress survives
    // reordering or rebuilding (old numeric unit keys are migrated once).
    key: `${level.toLowerCase()}|${u.videoId}|${u.seg}`,
    legacyKey: `${level.toLowerCase()}-unit-${i + 1}`,
    kind: "unit" as const,
    number: i + 1,
    level,
    source: "video" as const,
    title: `Scene ${i + 1}`,
    topic: "Real clip",
    grammar: "Steal the phrases people actually say.",
    grammarNote: "",
    duration: null,
    accent: ACCENTS[i % 3],
    passage: [],
    vocabulary: [],
    speakingPrompts: [],
    answerFrames: [],
    shadowLines: [],
    summary: SPEAK[level as keyof typeof SPEAK],
    voice: (i % 2 ? "andrew" : "ava") as "ava" | "andrew",
    videoId: u.videoId,
    seg: u.seg,
  }));
}

export const courses: Course[] = LEVELS.map((level) => ({
  ...META[level],
  range: "12 scenes",
  items: makeItems(level),
}));

export const courseMap = Object.fromEntries(courses.map((c) => [c.id, c])) as Record<string, Course>;
export const b1Course = courseMap["b1-core"];
export { levelVideos };
