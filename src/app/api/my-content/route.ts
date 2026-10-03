import { NextRequest } from "next/server";
import { fetchYouTubeCaptions } from "@/lib/youtubeCaptions";
import { buildMyContentLesson, type Cue } from "@/lib/lessonBuilder";
import { myContentLessons } from "@/data/myContent";
import baked from "@/data/my-content-transcripts.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const cache = new Map<string, ReturnType<typeof buildMyContentLesson>>();
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
  const lesson = myContentLessons.find((l) => l.id === id);
  if (!lesson) return Response.json({ error: "unknown lesson" }, { status: 404 });
  if (cache.has(id)) return Response.json(cache.get(id));

  const category = lesson.category === "design" ? "Design" : lesson.category === "client" ? "Work" : "Everyday";
  let result: ReturnType<typeof buildMyContentLesson> | null = null;

  // When a video is reused, give each day a different short section.
  const earlier = myContentLessons.filter((l) => l.videoId === lesson.videoId && l.day < lesson.day);
  const occurrence = earlier.length + (lesson.start ? 1 : 0);
  const startSec = lesson.start ?? 0;

  // 1) Prefer fresh real captions from YouTube.
  const caps = await fetchYouTubeCaptions(lesson.videoId, { fast: true }).catch(() => null);
  if (caps && caps.cues.length >= 8) {
    const cues = startSec ? caps.cues.filter((c) => c.t >= startSec * 1000) : caps.cues;
    if (cues.length >= 8) {
      result = buildMyContentLesson(
        cues,
        "B1",
        { title: caps.title || lesson.title, author: caps.author || "YouTube" },
        { focus: lesson.focus, category },
        startSec,
        occurrence,
      );
    }
  }

  // 2) Curated baked fallback so the full flow always opens.
  if (!result) {
    const b = bakedMap[lesson.videoId];
    if (b) {
      let cues: Cue[] = [];
      if (b.cues?.length) cues = startSec ? b.cues.filter((c) => c.t >= startSec * 1000) : b.cues;
      else if (b.transcript) cues = cuesFromText(b.transcript);
      if (cues.length) {
        result = buildMyContentLesson(
          cues,
          "B1",
          { title: b.title, author: b.author },
          { focus: lesson.focus, category },
          startSec,
          occurrence,
        );
        if (startSec) result.start = startSec;
      }
    }
  }

  if (!result) {
    return Response.json({ needsTranscript: true, videoId: lesson.videoId, title: lesson.title, focus: lesson.focus, category }, { status: 200 });
  }

  result.challenge = lesson.focus;
  cache.set(id, result);
  return Response.json(result);
}
