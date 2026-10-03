export type { VocabItem, LearningItem, Course } from "./courses";
export { courses, courseMap } from "./courses";

import { b1Course } from "./courses";

// Backward-compatible exports for the original B1 route and components.
export const book = {
  id: b1Course.id,
  level: b1Course.level,
  name: b1Course.name,
  arabicName: b1Course.name,
  englishName: `Read to Speak ${b1Course.level} — ${b1Course.name}`,
  range: b1Course.range,
  order: 1,
};

export const items = b1Course.items;
export const getItem = (key: string) => items.find((item) => item.key === key);
