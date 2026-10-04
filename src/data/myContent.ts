// Stable module name for the 3-month speaking track. The actual curriculum
// lives in curriculum.ts (real, clean, short clips, progressively staged).
import { curriculumLessons, TOTAL_DAYS } from "./curriculum";

export type McCategory =
  | "everyday" | "conversation" | "opinion" | "story" | "explain"
  | "questions" | "work" | "client" | "design" | "feedback" | "meeting" | "present";

export type McLesson = {
  id: string;
  key: string;
  day: number;
  week: number;
  stage: string;
  videoId: string;
  start?: number;
  end?: number;
  title: string;
  tag: string;
  category: McCategory;
  benefit: string;
  focus: string;
  accent: "emerald" | "apricot" | "ink";
  speaker: string;
};

// Adapt the curriculum to the shape the pages/components expect.
export const myContentLessons: McLesson[] = curriculumLessons.map((c) => ({
  id: c.key,
  key: c.key,
  day: c.day,
  week: c.week,
  stage: c.stage,
  videoId: c.videoId,
  start: c.start,
  end: c.end,
  title: c.title,
  tag: c.tag,
  category: c.category as McCategory,
  benefit: c.benefit,
  focus: c.focus,
  accent: c.accent,
  speaker: c.speaker,
}));

export const myContentIntro = {
  name: "My Content",
  tagline: "Your 3-month speaking path.",
  description:
    "Real short clips — everyday conversation, stories, ideas, then client and design meetings — turned into guided speaking practice. Short input, then you talk.",
  outputTarget:
    "Think in short English sentences and speak naturally for 45–60 seconds with real people and clients.",
};

export const MC_CATEGORY_LABEL: Record<McCategory, string> = {
  everyday: "Everyday English",
  conversation: "Conversations",
  opinion: "Opinions",
  story: "Stories",
  explain: "Explaining Ideas",
  questions: "Asking Questions",
  work: "Work & Freelancing",
  client: "Client Communication",
  design: "Design",
  feedback: "Feedback",
  meeting: "Negotiation & Meetings",
  present: "Presentations",
};

export { TOTAL_DAYS };
