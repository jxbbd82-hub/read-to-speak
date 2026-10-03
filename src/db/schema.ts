import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// Progress for an anonymous learner, keyed by a browser cookie uid.
// `key` identifies the learning item, e.g. "unit-1" or "review-1".
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  key: text("key").notNull(),
  listens: integer("listens").notNull().default(0),
  readingUnlocked: boolean("reading_unlocked").notNull().default(false),
  wordMarks: jsonb("word_marks").notNull().default({}),
  speakingDone: boolean("speaking_done").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProgressRow = typeof progress.$inferSelect;
