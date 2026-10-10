import { NextRequest } from "next/server";
import { fetchYouTubeCaptions } from "@/lib/youtubeCaptions";
import { buildSegment, type Cue, type SegmentLesson } from "@/lib/lessonBuilder";
import fallbackLessons from "@/data/lesson-fallback.json";
import realCaptions from "@/data/real-captions.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cache fetched captions per video (server instances reuse them across units).
const cueCache = new Map<string, { cues: Cue[]; title: string; author: string }>();
const lessonCache = new Map<string, SegmentLesson>();
const fallback = fallbackLessons as Record<string, SegmentLesson>;
// Genuine, timestamped captions bundled with the app (offline source).
const bundled = realCaptions as Record<string, { title: string; author: string; cues: Cue[] }>;

async function getMeta(videoId: string, fb: { title?: string; author?: string }) {
  if (fb.title) return { title: fb.title!, author: fb.author ?? "" };
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { signal: AbortSignal.timeout(7000), next: { revalidate: 86_400 } });
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
  const segIndex = Math.max(0, Number(req.nextUrl.searchParams.get("seg") ?? 0));
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return Response.json({ error: "bad video id" }, { status: 400 });

  const cacheKey = `${videoId}|${level}|${segIndex}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return Response.json(cached);

  const baked = fallback[`${level}|${videoId}|${segIndex}`];

  // Real captions are the single source of truth for timing and for the
  // displayed sentences. Order: live YouTube -> bundled real captions
  // (offline) -> never fabricate.
  let real: { cues: Cue[]; title: string; author: string } | null = null;
  if (cueCache.has(videoId)) {
    real = cueCache.get(videoId)!;
  } else if (bundled[videoId]?.cues?.length >= 4) {
    const b = bundled[videoId];
    // Genuine caption metadata wins over any stale baked scene title.
    real = { cues: b.cues, title: b.title, author: b.author };
    cueCache.set(videoId, real);
  } else {
    const caps = await fetchYouTubeCaptions(videoId).catch(() => null);
    if (caps && caps.cues.length >= 4) {
      const meta = await getMeta(videoId, { title: caps.title, author: caps.author });
      real = { cues: caps.cues, title: caps.title || meta.title, author: caps.author || meta.author };
      if (cueCache.size > 400) cueCache.delete(cueCache.keys().next().value as string);
      cueCache.set(videoId, real);
    }
  }

  if (real) {
    // buildSegment slices the cues into the requested scene and sets
    // timedSentences entirely from REAL cue timestamps (no estimation).
    const lesson = buildSegment(real.cues, level, segIndex, { title: real.title, author: real.author });
    (lesson as SegmentLesson & { synced?: boolean }).synced = true;
    lessonCache.set(cacheKey, lesson);
    return Response.json(lesson);
  }

  // No real captions available (rate-limit / none). Use the curated baked
  // scene for the study content, but do NOT attach fabricated timestamps;
  // `synced:false` tells the UI sentence clicks are spoken TTS, not video seek.
  if (baked) {
    baked.timedSentences = [];
    (baked as SegmentLesson & { synced?: boolean }).synced = false;
    lessonCache.set(cacheKey, baked);
    return Response.json(baked);
  }

  return Response.json({ needsTranscript: true, videoId }, { status: 200 });
}
