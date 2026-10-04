import type { LearningItem } from "@/data/book";

export type Accent = {
  solid: string;
  soft: string;
  line: string;
  text: string;
};

// Restrained, premium light-palette accents. Solid always carries white text;
// soft is a tinted surface; text/line work on warm paper and white cards.
export const accents: Record<LearningItem["accent"], Accent> = {
  emerald: { solid: "#1d6f5b", soft: "#e8f1ed", line: "#bfd6cc", text: "#1d6f5b" },
  apricot: { solid: "#b06a2c", soft: "#f5ece0", line: "#e0cbb1", text: "#9a5c25" },
  ink: { solid: "#3f4585", soft: "#eceef8", line: "#ccd0ec", text: "#3f4585" },
};

export const MAX_MARKS = 5;

export type ProgressEntry = {
  listens: number;
  readingUnlocked: boolean;
  wordMarks: Record<string, number>;
  speakingDone: boolean;
  completed: boolean;
};
