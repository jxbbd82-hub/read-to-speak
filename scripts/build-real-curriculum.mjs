// Builds a 12-week speaking curriculum ENTIRELY from videos that have real,
// timestamped captions bundled in real-captions.json. Writes:
//   src/data/curriculum-real.ts   (manifest: id, video, start, end, stage…)
//   src/data/my-content-real.json (per-lesson transcript text + real cues)
// Every scene's timestamps are genuine caption timing — no estimation.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const real = require("../src/data/real-captions.json");

const TARGET_WORDS = 150; // ~1.5 minute spoken scenes
const MIN_WORDS = 70;

// Split each video's real cues into sequential, non-overlapping short scenes.
function scenesFor(id, target = TARGET_WORDS) {
  const cues = real[id].cues;
  const out = [];
  let buf = [];
  let words = 0;
  const flush = () => {
    if (!buf.length) return;
    const text = buf.map((c) => c.text).join(" ");
    if (text.split(/\s+/).length >= MIN_WORDS) {
      out.push({
        cues: buf,
        startSec: buf[0].t / 1000,
        endSec: (buf.at(-1).t + (buf.at(-1).d || 2000)) / 1000,
      });
    }
    buf = []; words = 0;
  };
  for (const c of cues) {
    buf.push(c); words += c.text.split(/\s+/).length;
    if (words >= target) flush();
  }
  flush();
  return out;
}

// Curated, progressive stages mapped to CLEAN real-captioned videos.
// Animation / clean film (beginner) -> interviews / conversation (middle) ->
// longer interviews & storytelling (upper). All real captions, all clean.
const STAGES = [
  { stage: "Week 1 · Greetings & simple talk",      picks: ["h2PbncQq0jM", "8266-l00Ows", "nhDIlSdpV-c", "RxHPtsIYBWQ", "CEKc4vKzO_s"] },
  { stage: "Week 2 · Everyday conversation",         picks: ["dwzxYwbqHAQ", "8266-l00Ows", "CEKc4vKzO_s", "RxHPtsIYBWQ", "qTSDL94_Y7M"] },
  { stage: "Week 3 · Describing things",            picks: ["XHrw3AFW0Z0", "TjpkMfTBVQs", "qTSDL94_Y7M", "CEKc4vKzO_s", "dwzxYwbqHAQ"] },
  { stage: "Week 4 · Small talk & reacting",        picks: ["XeBE7bFqOgU", "ThEpPnmBYMw", "DrXEXZhAo1A", "XHrw3AFW0Z0", "TjpkMfTBVQs"] },
  { stage: "Week 5 · Opinions & reactions",         picks: ["Xe-7dLntOeQ", "DrXEXZhAo1A", "XeBE7bFqOgU", "OqdWdbmLya8", "fPohqlw6QzE"] },
  { stage: "Week 6 · Telling short stories",        picks: ["Xe-7dLntOeQ", "OqdWdbmLya8", "ThEpPnmBYMw", "fPohqlw6QzE", "p8-uEJ11GAM"] },
  { stage: "Week 7 · Asking & clarifying",          picks: ["p8-uEJ11GAM", "XeBE7bFqOgU", "DrXEXZhAo1A", "Xe-7dLntOeQ", "OqdWdbmLya8"] },
  { stage: "Week 8 · Explaining ideas",             picks: ["s_m22BxJE08", "eF7zdv4HWVo", "p8-uEJ11GAM", "Xe-7dLntOeQ", "ThEpPnmBYMw"] },
  { stage: "Week 9 · Talking about work",           picks: ["s_m22BxJE08", "eF7zdv4HWVo", "RZ7RpzRia78", "34ttspXxYlw", "iqdSagycCWc"] },
  { stage: "Week 10 · Client-style questions",      picks: ["RZ7RpzRia78", "hTpCbSat1-0", "s_m22BxJE08", "eF7zdv4HWVo", "iqdSagycCWc"] },
  { stage: "Week 11 · Feedback, views & negotiation", picks: ["RZ7RpzRia78", "34ttspXxYlw", "hTpCbSat1-0", "lEgqCXJ5Jk0", "iqdSagycCWc"] },
  { stage: "Week 12 · Presenting & storytelling",   picks: ["lEgqCXJ5Jk0", "iqdSagycCWc", "RZ7RpzRia78", "hTpCbSat1-0", "34ttspXxYlw"] },
];

const FOCUS = [
  "Retell this moment in your own words for 45 seconds.",
  "Describe how the speakers feel and why.",
  "Use one phrase from the scene in a sentence about your week.",
  "Explain what happened as if telling a friend.",
  "Give your opinion and one clear reason.",
];
const BENEFIT = [
  "Copy natural reactions and short replies.",
  "Practice everyday questions and answers.",
  "Useful words for describing a situation.",
  "Steal phrases for a relaxed conversation.",
  "Form and support a simple opinion.",
];

const lessons = [];
const transcripts = {};
let day = 0;
const seenVideo = new Map();

for (const wk of STAGES) {
  for (let j = 0; j < 5; j++) {
    const videoId = wk.picks[j];
    const meta = real[videoId];
    if (!meta) { console.error("missing", videoId); process.exit(1); }
    const idx = seenVideo.get(videoId) ?? 0;
    const all = scenesFor(videoId);
    // spread scenes for repeated videos across their real windows
    const scene = all[idx % all.length];
    seenVideo.set(videoId, idx + 1);
    if (!scene) { console.error("no scene", videoId, idx); process.exit(1); }
    day += 1;
    const key = `mc-${String(day).padStart(2, "0")}`;
    const text = scene.cues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
    const week = Math.ceil(day / 5);
    const cat = week <= 4 ? "everyday" : week <= 8 ? "conversation" : "work";
    lessons.push({
      key, day, week, stage: wk.stage,
      videoId,
      start: Math.round(scene.startSec),
      end: Math.round(scene.endSec),
      title: text.split(/(?<=[.!?])/)[0].slice(0, 70).trim() || meta.title,
      speaker: meta.author || meta.title,
      tag: `${wk.stage.split("·")[1].trim()}`,
      category: cat,
      benefit: BENEFIT[j % BENEFIT.length],
      focus: FOCUS[j % FOCUS.length],
      accent: ["emerald", "apricot", "ink"][day % 3],
    });
    // Real cues restricted to the scene window, times kept absolute so they
    // match the original video player seek position.
    const cues = meta.cues.filter((c) => c.t / 1000 >= scene.startSec - 0.2 && c.t / 1000 <= scene.endSec + 0.5);
    transcripts[key] = { title: meta.title, author: meta.author, cues, transcript: text };
  }
}

writeFileSync("src/data/my-content-real.json", JSON.stringify(transcripts, null, 1));

const ts = `// AUTO-GENERATED real-caption curriculum. Do not edit by hand.
// All videos have genuine timestamped captions bundled in real-captions.json.
import type { Cat } from "./myContent.ts";
export type RealLesson = {
  key: string; day: number; week: number; stage: string;
  videoId: string; start: number; end: number;
  title: string; speaker: string; tag: string; category: Cat;
  benefit: string; focus: string; accent: "emerald" | "apricot" | "ink";
};
export const realLessons: RealLesson[] = ${JSON.stringify(lessons, null, 2)};
`;
writeFileSync("src/data/curriculum-real.ts", ts);
console.log("built", lessons.length, "real-caption lessons across", STAGES.length, "weeks");
const vids = [...new Set(lessons.map((l) => l.videoId))];
console.log("distinct videos used:", vids.length);
