import type { LearningItem } from "@/data/book";

export type Accent = {
  solid: string;
  soft: string;
  line: string;
  text: string;
};

// Dark-tuned accents; solid works with white text.
export const accents: Record<LearningItem["accent"], Accent> = {
  emerald: { solid: "#2ea88f", soft: "#0f2825", line: "#1c4740", text: "#5fd3b3" },
  apricot: { solid: "#d18444", soft: "#2a1d11", line: "#55381d", text: "#efac72" },
  ink: { solid: "#7b82e6", soft: "#1b1d3a", line: "#33376b", text: "#b4b9f2" },
};

export const MAX_MARKS = 5;

export type ProgressEntry = {
  listens: number;
  readingUnlocked: boolean;
  wordMarks: Record<string, number>;
  speakingDone: boolean;
  completed: boolean;
};
