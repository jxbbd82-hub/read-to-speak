// Real, entertaining clips grouped by level. Units are generated from each
// video's captions; a long clip contributes several timed scenes. Nothing
// here is a "lesson about English" — shows, movies, games, and interviews.
import manifestData from "./manifest-data.json";

export type ManifestVideo = { id: string; parts: number };

export const levelVideos: Record<string, ManifestVideo[]> = manifestData as Record<string, ManifestVideo[]>;

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// Flatten into the 12 units of a level.
export function unitsForLevel(level: string) {
  const pool = levelVideos[level] ?? [];
  const plan: Array<{ videoId: string; seg: number }> = [];
  for (const v of pool) for (let seg = 0; seg < v.parts; seg++) plan.push({ videoId: v.id, seg });
  // Guarantee 12 units by cycling the pool's scenes if a manifest is short.
  let i = 0;
  while (plan.length < 12 && pool.length) {
    const v = pool[i % pool.length];
    plan.push({ videoId: v.id, seg: v.parts + Math.floor(i / pool.length) });
    i++;
  }
  return plan.slice(0, 12);
}

// Unique videos that need captions fetched/baked.
export function allManifestVideos() {
  const ids = new Set<string>();
  for (const level of LEVELS) for (const v of levelVideos[level]) ids.add(v.id);
  return [...ids];
}
