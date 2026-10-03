import { NextRequest } from "next/server";
import { fetchYouTubeCaptions } from "@/lib/youtubeCaptions";
import { buildFromTranscript, type SegmentLesson } from "@/lib/lessonBuilder";
import { extractYouTubeId, voiceForLevel } from "@/lib/youtubeLab";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const allowedLevels = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

async function metadata(videoId: string) {
  const watch = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`, {
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 86_400 },
    });
    if (r.ok) {
      const d = (await r.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
      return { title: d.title ?? "My video lesson", author: d.author_name ?? "YouTube", thumbnail: d.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, url: watch };
    }
  } catch { /* fall through */ }
  return { title: "My video lesson", author: "YouTube", thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, url: watch };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string; level?: string; transcript?: string };
    const videoId = extractYouTubeId(body.url ?? "");
    if (!videoId) return Response.json({ error: "Paste a valid YouTube link or 11-character video ID." }, { status: 400 });
    const level = allowedLevels.has(body.level ?? "") ? body.level! : "B1";
    const meta = await metadata(videoId);

    let transcript = (body.transcript ?? "").trim();
    let source: "captions" | "manual" | "none" = "none";

    if (transcript.length >= 40) source = "manual";
    else {
      const caps = await fetchYouTubeCaptions(videoId, { fast: false }).catch(() => null);
      if (caps && caps.transcript.length > 60) {
        transcript = caps.transcript.slice(0, 6000);
        source = "captions";
        if (caps.title) meta.title = caps.title;
        if (caps.author) meta.author = caps.author;
      }
    }

    if (transcript.length < 40) {
      // The video still opens; learner watches with captions and supplies lines.
      return Response.json({
        id: `yt-${videoId}`, videoId, level, voice: voiceForLevel(level), ...meta,
        needsTranscript: true,
        notice: "Auto-captions weren't readable for this video. Watch it with English captions, then paste 4+ lines (or use Show transcript) — it becomes a full lesson instantly.",
        chunks: [], shadowLines: [], questions: [], answerFrames: [],
      });
    }

    const built: SegmentLesson = buildFromTranscript(transcript, level, { title: meta.title, author: meta.author });
    return Response.json({
      id: `yt-${videoId}`, videoId, level, voice: voiceForLevel(level), ...meta,
      needsTranscript: false,
      source,
      chunks: built.chunks.map((w) => ({ phrase: w.word, meaning: w.meaning, context: w.example })),
      shadowLines: built.shadows,
      questions: built.questions,
      answerFrames: built.frames,
      writingPrompt: built.writingPrompt,
      thinkPrompts: built.thinkPrompts,
      transcript: built.passage,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "We couldn't open this video." }, { status: 500 });
  }
}
