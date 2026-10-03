import { NextRequest } from "next/server";
import { fetchYouTubeCaptions } from "@/lib/youtubeCaptions";
import { buildSegment, type Cue, type SegmentLesson } from "@/lib/lessonBuilder";
import fallbackLessons from "@/data/lesson-fallback.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cache fetched captions per video (server instances reuse them across units).
const cueCache = new Map<string, { cues: Cue[]; title: string; author: string }>();
const lessonCache = new Map<string, SegmentLesson>();
const fallback = fallbackLessons as Record<string, SegmentLesson>;

async function getMeta(videoId: string, fallback: { title?: string; author?: string }) {
  if (fallback.title) return { title: fallback.title!, author: fallback.author ?? "" };
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { signal: AbortSignal.timeout(7000), next: { revalidate: 86400 } });
    if (r.ok) {
      const d = (await r.json()) as { title?: string; author_name?: string };
      return { title: d.title ?? videoId, author: d.author_name ?? "YouTube" };
    }
  } catch { /* ignore */ }
  return { title: videoId, author: "YouTube" };
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("v") ?? "";
  const level = (req.nextUrl.searchParams.get("level") ?? "B1").toUpperCase();
  const seg = Math.max(0, Number(req.nextUrl.searchParams.get("seg") ?? 0));
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return Response.json({ error: "bad video id" }, { status: 400 });

  const cacheKey = `${videoId}|${level}|${seg}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return Response.json(cached);

  // Prefer the fully baked, level-built scene (guaranteed complete: chunks,
  // shadows, questions, frames, writing, thinking). Live fetch is only used
  // for videos that have no baked content.
  const baked = fallback[`${level}|${videoId}|${seg}`];
  if (baked) {
    lessonCache.set(cacheKey, baked);
    return Response.json(baked);
  }

  const entry = cueCache.get(videoId);
  if (!entry) {
    const caps = await fetchYouTubeCaptions(videoId).catch(() => null);
    if (!caps || caps.cues.length < 4) {
      return Response.json({ needsTranscript: true, videoId }, { status: 200 });
    }
    const meta = await getMeta(videoId, { title: caps.title, author: caps.author });
    const made = { cues: caps.cues, title: caps.title || meta.title, author: caps.author || meta.author };
    if (cueCache.size > 400) cueCache.delete(cueCache.keys().next().value as string);
    cueCache.set(videoId, made);
    const lesson = buildSegment(made.cues, level, seg, { title: made.title, author: made.author });
    lessonCache.set(cacheKey, lesson);
    return Response.json(lesson);
  }

  const lesson = buildSegment(entry.cues, level, seg, { title: entry.title, author: entry.author });
  lessonCache.set(cacheKey, lesson);
  return Response.json(lesson);
}
