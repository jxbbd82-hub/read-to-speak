import { NextRequest } from "next/server";
import { fetchYouTubeCaptions } from "@/lib/youtubeCaptions";
import { buildMyContentLesson, type Cue } from "@/lib/lessonBuilder";
import { myContentLessons } from "@/data/myContent";
import baked from "@/data/my-content-transcripts.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const cache = new Map<string, ReturnType<typeof buildMyContentLesson>>();
// Keyed by lesson key (mc-01, mc-02…) — each entry is a SHORT scene.
const bakedMap = baked as Record<string, { title: string; author: string; cues?: Cue[]; transcript?: string }>;

function cuesFromText(transcript: string): Cue[] {
  let t = 0;
  return (
    transcript
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((s) => {
        const text = s.trim();
        const cue: Cue = { t, d: text.split(/\s+/).length * 420, text };
        t += cue.d;
        return cue;
      }) ?? []
  );
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const lesson = myContentLessons.find((l) => l.id === id || l.key === id);
  if (!lesson) return Response.json({ error: "unknown lesson" }, { status: 404 });
  if (cache.has(lesson.key)) return Response.json(cache.get(lesson.key));

  const category = lesson.category === "design" ? "Design" :
    lesson.category === "client" || lesson.category === "work" || lesson.category === "meeting" || lesson.category === "feedback" || lesson.category === "present" ? "Work" : "Everyday";

  let result: ReturnType<typeof buildMyContentLesson> | null = null;
  const startSec = lesson.start ?? 0;
  const endSec = lesson.end ?? 0;

  // 1) Fresh real captions, trimmed to the short scene window.
  const caps = await fetchYouTubeCaptions(lesson.videoId, { fast: true }).catch(() => null);
  if (caps && caps.cues.length >= 8) {
    let cues = caps.cues;
    if (startSec) cues = cues.filter((c) => c.t >= startSec * 1000);
    if (endSec) cues = cues.filter((c) => c.t <= endSec * 1000);
    if (cues.length >= 6) {
      result = buildMyContentLesson(
        cues, "B1",
        { title: caps.title || lesson.title, author: caps.author || lesson.speaker },
        { focus: lesson.focus, category }, startSec, 0,
      );
    }
  }

  // 2) Bundled scene transcript (accurate, short, keyed per lesson).
  if (!result) {
    const b = bakedMap[lesson.key] ?? bakedMap[lesson.videoId];
    if (b) {
      const cues: Cue[] = b.cues?.length ? b.cues : cuesFromText(b.transcript ?? "");
      if (cues.length) {
        result = buildMyContentLesson(
          cues, "B1",
          { title: b.title || lesson.title, author: b.author || lesson.speaker },
          { focus: lesson.focus, category }, startSec, 0,
        );
        result.start = startSec;
      }
    }
  }

  if (!result) {
    return Response.json({ needsTranscript: true, videoId: lesson.videoId, title: lesson.title, focus: lesson.focus, category }, { status: 200 });
  }

  result.challenge = lesson.focus;
  cache.set(lesson.key, result);
  return Response.json(result);
}
