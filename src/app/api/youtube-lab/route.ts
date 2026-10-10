import { NextRequest } from "next/server";
import { fetchYouTubeCaptions } from "@/lib/youtubeCaptions";
import { buildFromTranscript, buildMyContentLesson, cuesToTimedSentences, splitSentences, type Cue, type SegmentLesson } from "@/lib/lessonBuilder";
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
    let realCues: Cue[] = [];

    if (transcript.length >= 40) source = "manual";
    else {
      // Real captions are the single source of truth for text AND timing.
      const caps = await fetchYouTubeCaptions(videoId, { fast: true }).catch(() => null);
      if (caps && caps.transcript.length > 60) {
        transcript = caps.transcript.slice(0, 6000);
        realCues = caps.cues ?? [];
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

    // Robust scene (guarantees 6 phrases + 6 shadows, caps to a short clip),
    // merged with level-aware questions / writing / thinking from the full
    // transcript so the lesson is both complete AND at the right level.
    // Use the same sentence splitter as the rest of the engine (handles
    // punctuation/ASR reliably), then keep the practice INPUT short.
    const sentences = splitSentences(transcript);
    const allCues: Cue[] = sentences.map((text, i) => ({ t: i * 1200, d: 1200, text }));
    const TARGET_WORDS: Record<string, number> = { A1: 90, A2: 120, B1: 160, B2: 190, C1: 220, C2: 250 };
    const cap = TARGET_WORDS[level] ?? 160;
    const shortCues: Cue[] = [];
    let words = 0;
    for (const c of allCues) {
      shortCues.push(c);
      words += c.text.split(/\s+/).length;
      if (words >= cap) break;
    }
    const workLevel = /C1|C2|B2/.test(level) ? "Work" : "Everyday";
    // Only real YouTube captions carry accurate timings. Manual pasted
    // transcripts can't be aligned to the video, so they get NO synced
    // timestamps (the UI speaks those lines via TTS rather than mis-seeking).
    const isReal = source === "captions" && realCues.length >= 4;
    const cuesForBuild = isReal
      ? (() => {
          // keep the input scene short using real cues
          let acc = 0; const out: Cue[] = [];
          const capW = { A1: 200, A2: 260, B1: 340, B2: 400, C1: 460, C2: 520 }[level] ?? 340;
          for (const c of realCues) { out.push(c); acc += c.text.split(/\s+/).length; if (acc >= capW) break; }
          return out.length >= 3 ? out : realCues;
        })()
      : (shortCues.length >= 3 ? shortCues : allCues);
    const robust = buildMyContentLesson(
      cuesForBuild,
      level,
      { title: meta.title, author: meta.author },
      { focus: "", category: workLevel },
      0, 0, isReal,
    );
    if (isReal) robust.timedSentences = cuesToTimedSentences(cuesForBuild);
    const leveled: SegmentLesson = buildFromTranscript(transcript, level, { title: meta.title, author: meta.author });

    const finalLesson: SegmentLesson = {
      ...robust,
      // keep level-specific prompts/writing, but always have the robust shadows/chunks
      questions: leveled.questions,
      frames: leveled.frames,
      writingPrompt: leveled.writingPrompt,
      thinkPrompts: leveled.thinkPrompts,
      passage: robust.passage,
    };

    return Response.json({
      id: `yt-${videoId}`, videoId, level, voice: voiceForLevel(level), ...meta,
      needsTranscript: false,
      source,
      chunks: finalLesson.chunks.map((w) => ({ phrase: w.word, meaning: w.meaning, context: w.example })),
      shadowLines: finalLesson.shadows,
      questions: finalLesson.questions,
      answerFrames: finalLesson.frames,
      writingPrompt: finalLesson.writingPrompt,
      thinkPrompts: finalLesson.thinkPrompts,
      transcript: finalLesson.passage,
      timedSentences: isReal ? (finalLesson.timedSentences ?? []) : [],
      synced: isReal,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "We couldn't open this video." }, { status: 500 });
  }
}
