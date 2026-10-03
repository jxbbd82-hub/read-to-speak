import { NextRequest } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One consistent native-American MALE voice for all platform-generated
// sentence/phrase/shadow audio across the whole product. The real human
// speaker of each YouTube video is never replaced — this is only for the
// practice lines the platform generates.
const PLATFORM_VOICE = "en-US-AndrewNeural";
const voices: Record<string, string> = {
  andrew: PLATFORM_VOICE,
  ava: PLATFORM_VOICE,
  emma: PLATFORM_VOICE,
  jenny: PLATFORM_VOICE,
};

// Same pacing as the built-in lessons.
const rates: Record<string, string> = {
  A1: "-16%",
  A2: "-11%",
  B1: "-6%",
  B2: "-1%",
  C1: "+2%",
  C2: "+4%",
};

const cache = new Map<string, Buffer>();
const CACHE_LIMIT = 200;

function chunkText(text: string): string[] {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).length > 1800 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  // Keep serverless generation inside free-host time limits.
  return chunks.slice(0, 6);
}

async function synthesize(text: string, voiceName: string, rate: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for (const part of chunkText(text)) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(part, { rate });
    for await (const data of audioStream) chunks.push(Buffer.from(data));
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { text?: string; voice?: string; level?: string; rate?: string };
    const text = (body.text ?? "").trim().slice(0, 14_000);
    if (!text) return new Response("Missing text", { status: 400 });

    const voiceName = voices[body.voice ?? ""] ?? voices.ava;
    const rate = body.rate || rates[body.level ?? ""] || "-4%";
    const cacheKey = `${voiceName}|${rate}|${text}`;
    let audio = cache.get(cacheKey);
    if (!audio) {
      audio = await synthesize(text, voiceName, rate);
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      cache.set(cacheKey, audio);
    }

    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    console.error("[tts]", error);
    return new Response("Speech synthesis unavailable", { status: 502 });
  }
}
