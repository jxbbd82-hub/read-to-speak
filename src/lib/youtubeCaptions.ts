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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTrackText(baseUrl: string, translate: boolean, allowRetry = true): Promise<{ text: string; cues: TimedCue[] } | null> {
  // XML first, then a short backoff on transient 429s, then JSON3 as backup.
  const variants = [
    baseUrl,
    baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=srv3`,
  ];
  const urls = translate ? variants.map((u) => `${u}&tlang=en`).concat(variants) : variants;
  for (let attempt = 0; attempt < urls.length + 1; attempt++) {
    const url = urls[Math.min(attempt, urls.length - 1)];
    for (let retry = 0; retry < (allowRetry ? 2 : 1); retry++) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(allowRetry ? 9000 : 5000),
          headers: { "accept-language": "en-US,en;q=0.9" },
        });
        if (res.status === 429) { if (allowRetry) await sleep(400 * (retry + 1)); continue; }
        if (!res.ok) break;
        const body = await res.text();
        if (body.startsWith("<?xml") || body.startsWith("<timedtext")) {
          const parsed = parseTimedText(body);
          if (parsed.text.length > 30) return { text: parsed.text, cues: parsed.cues };
        }
        if (body.trim().startsWith("{")) {
          try {
            const cues = parseJson3(body);
            if (cues.length) {
              const text = cues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
              if (text.length > 30) return { text, cues };
            }
          } catch { /* ignore bad json */ }
        }
        break;
      } catch {
        break;
      }
    }
  }
  return null;
}

function parseJson3(json: string): TimedCue[] {
  const data = JSON.parse(json) as { events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }> };
  const cues: TimedCue[] = [];
  for (const ev of data.events ?? []) {
    const text = (ev.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (text) cues.push({ t: ev.tStartMs ?? 0, d: ev.dDurationMs ?? 1500, text });
  }
  return cues;
}

export async function fetchYouTubeCaptions(videoId: string, opts?: { fast?: boolean }): Promise<CaptionResult | null> {
  // Fast mode still retries a timedtext 429 once (most transient limits
  // clear immediately), but uses a single client to stay quick.
  const allowRetry = true;
  const active = opts?.fast ? clients.slice(0, 1) : clients;
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

      // Try English tracks in priority order, then translate any track.
      const englishTracks = [
        tracks.find((t) => (t.languageCode ?? "").toLowerCase() === "en-us" && t.kind !== "asr"),
        tracks.find((t) => (t.languageCode ?? "").toLowerCase() === "en" && t.kind !== "asr"),
        tracks.find((t) => (t.languageCode ?? "").toLowerCase().startsWith("en") && t.kind !== "asr"),
        tracks.find((t) => (t.languageCode ?? "").toLowerCase().startsWith("en")),
      ].filter((t): t is NonNullable<typeof t> => !!t);
      const candidates = englishTracks.length ? englishTracks : tracks.slice(0, 2);

      let parsed: { text: string; cues: TimedCue[] } | null = null;
      let chosen = candidates[0];
      for (const tr of candidates) {
        const isEnglish = (tr.languageCode ?? "").toLowerCase().startsWith("en");
        const p = await fetchTrackText(tr.baseUrl, !isEnglish, allowRetry);
        if (p && p.text.length > 30) { parsed = p; chosen = tr; break; }
      }
      if (!parsed || parsed.text.length < 30) continue;

      return {
        transcript: parsed.text,
        cues: parsed.cues,
        language: chosen.languageCode ?? "unknown",
        translated: !(chosen.languageCode ?? "").toLowerCase().startsWith("en"),
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

/**
 * Returns ONLY real, caption-derived timed cues for the given time window.
 * Never estimates or fabricates timing. Returns [] when no real captions are
 * available — callers must treat that as "no synced transcript".
 */
export async function fetchRealCues(videoId: string, startSec = 0, endSec = 0): Promise<TimedCue[]> {
  const caps = await fetchYouTubeCaptions(videoId).catch(() => null);
  if (!caps || !caps.cues.length) return [];
  return caps.cues.filter((c) => {
    if (startSec && c.t < startSec * 1000 - 100) return false;
    if (endSec && c.t > endSec * 1000 + 100) return false;
    return true;
  });
}
