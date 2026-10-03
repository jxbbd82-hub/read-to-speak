// Robust YouTube caption reader. YouTube blocks many hosted environments on the
// web client, but the ANDROID InnerTube client usually returns caption tracks.
// We try several clients, parse YouTube's timedtext XML, and best-effort
// auto-translate non-English captions into English.

type ClientDef = {
  name: string;
  key: string;
  body: Record<string, unknown>;
  ua?: string;
};

const ANDROID_KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const WEB_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

const clients: ClientDef[] = [
  {
    name: "android",
    key: ANDROID_KEY,
    ua: "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip",
    body: {
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "en-US", gl: "US" } },
    },
  },
  {
    name: "android_vr",
    key: WEB_KEY,
    ua: "com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; en_US)",
    body: {
      context: { client: { clientName: "ANDROID_VR", clientVersion: "1.60.19", deviceMake: "Oculus", deviceModel: "Quest 3", androidSdkVersion: 32, hl: "en-US", gl: "US" } },
    },
  },
  {
    name: "ios",
    key: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc",
    ua: "com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)",
    body: {
      context: { client: { clientName: "IOS", clientVersion: "19.45.4", deviceMake: "Apple", deviceModel: "iPhone16,2", hl: "en-US", gl: "US" } },
    },
  },
  {
    name: "tv",
    key: "AIzaSyDCU3wn7gsTdpMJmoxvOPp6CfmgpH7z1k0",
    body: {
      context: { client: { clientName: "TVHTML5", clientVersion: "7.20240726.13.00", hl: "en-US", gl: "US" } },
    },
  },
];

export type TimedCue = { t: number; d: number; text: string };

export type CaptionResult = {
  transcript: string;
  cues: TimedCue[];
  language: string;
  translated: boolean;
  title?: string;
  author?: string;
  lengthSeconds?: string;
};

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

function parseTimedText(xml: string): { text: string; cues: TimedCue[] } {
  const cues: TimedCue[] = [];
  const paragraphPattern = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;
  while ((match = paragraphPattern.exec(xml))) {
    const attrs = match[1];
    const t = Number((attrs.match(/\bt="(\d+)"/) ?? [])[1] ?? 0);
    const d = Number((attrs.match(/\bd="(\d+)"/) ?? [])[1] ?? 2000);
    let text = decodeEntities(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
    // Strip leading speaker labels, e.g. "BERT: Yes." or "ANDY SAMBERG: I mean…"
    text = text.replace(/^(?:[A-Z][A-Z .'&-]{1,28}:\s*)+/, "").trim();
    // Remove non-speech markers like [Music] and (applause) for language study.
    const spoken = text.replace(/\[[^\]]*\]/g, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    if (spoken && !/^[:\-\s]+$/.test(spoken)) cues.push({ t, d, text: spoken });
  }
  return { text: cues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim(), cues };
}

async function fetchTrackText(baseUrl: string, translate: boolean): Promise<{ text: string; cues: TimedCue[] } | null> {
  const urls = translate
    ? [`${baseUrl}&tlang=en`, baseUrl]
    : [baseUrl];
  for (const url of urls) {
    const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!res.ok) continue;
    const xml = await res.text();
    if (!xml.startsWith("<?xml") && !xml.startsWith("<timedtext")) continue;
    const parsed = parseTimedText(xml);
    if (parsed.text.length > 30) return { text: parsed.text, cues: parsed.cues };
  }
  return null;
}

export async function fetchYouTubeCaptions(videoId: string, opts?: { fast?: boolean }): Promise<CaptionResult | null> {
  const active = opts?.fast ? clients.slice(0, 2) : clients;
  for (const client of active) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${client.key}&prettyPrint=false`, {
        method: "POST",
        signal: AbortSignal.timeout(opts?.fast ? 6_000 : 10_000),
        headers: {
          "content-type": "application/json",
          ...(client.ua ? { "user-agent": client.ua } : {}),
        },
        body: JSON.stringify({
          ...client.body,
          videoId,
          playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" } },
        }),
      });
      if (!response.ok) continue;
      const data = (await response.json()) as {
        captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Array<{ baseUrl: string; languageCode: string; kind?: string; name?: { simpleText?: string } }> } };
        videoDetails?: { title?: string; author?: string; lengthSeconds?: string };
      };
      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (!tracks.length) continue;

      const english =
        tracks.find((t) => (t.languageCode ?? "").toLowerCase() === "en-us" && t.kind !== "asr") ??
        tracks.find((t) => (t.languageCode ?? "").toLowerCase() === "en" && t.kind !== "asr") ??
        tracks.find((t) => (t.languageCode ?? "").toLowerCase().startsWith("en") && t.kind !== "asr") ??
        tracks.find((t) => (t.languageCode ?? "").toLowerCase().startsWith("en"));
      const chosen = english ?? tracks[0];

      const translated = !english;
      const parsed = await fetchTrackText(chosen.baseUrl, translated);
      if (!parsed || parsed.text.length < 30) continue;

      return {
        transcript: parsed.text,
        cues: parsed.cues,
        language: chosen.languageCode ?? "unknown",
        translated: translated && parsed.text.length > 30,
        title: data.videoDetails?.title,
        author: data.videoDetails?.author,
        lengthSeconds: data.videoDetails?.lengthSeconds,
      };
    } catch {
      // Try the next client.
    }
  }
  return null;
}
