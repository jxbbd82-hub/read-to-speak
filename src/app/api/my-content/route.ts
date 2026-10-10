import { NextRequest } from "next/server";
import {
  buildMyContentLesson,
  cuesToTimedSentences,
  type Cue,
  type SegmentLesson,
} from "@/lib/lessonBuilder";
import { myContentLessons } from "@/data/myContent";
// Genuine, timestamped captions bundled per lesson (real source of truth).
import realScenes from "@/data/my-content-real.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const cache = new Map<string, SegmentLesson>();
const scenes = realScenes as Record<string, { title: string; author: string; cues?: Cue[]; transcript?: string }>;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const lesson = myContentLessons.find((l) => l.id === id || l.key === id);
  if (!lesson) return Response.json({ error: "unknown lesson" }, { status: 404 });
  if (cache.has(lesson.key)) return Response.json(cache.get(lesson.key));

  const category = ["client", "work", "meeting", "feedback", "present", "design"].includes(lesson.category)
    ? "Work"
    : "Everyday";

  const scene = scenes[lesson.key];
  if (!scene || !scene.cues?.length) {
    return Response.json({ needsTranscript: true, videoId: lesson.videoId, title: lesson.title }, { status: 200 });
  }

  // Filter genuine cues to this scene's absolute time window.
  const startSec = lesson.start ?? 0;
  const endSec = lesson.end ?? 0;
  let cues = scene.cues;
  if (startSec) cues = cues.filter((c) => c.t >= startSec * 1000 - 200);
  if (endSec) cues = cues.filter((c) => c.t <= endSec * 1000 + 500);

  const result = buildMyContentLesson(
    cues, "B1",
    { title: scene.title || lesson.title, author: scene.author || lesson.speaker },
    { focus: lesson.focus, category },
    startSec, 0, true, // realTimings = true
  );
  // Sentence timestamps come straight from genuine captions.
  result.timedSentences = cuesToTimedSentences(cues);
  result.start = Math.round(cues[0]?.t ? cues[0].t / 1000 : startSec);
  result.challenge = lesson.focus;
  (result as SegmentLesson & { synced?: boolean }).synced = true;

  cache.set(lesson.key, result);
  return Response.json(result);
}
