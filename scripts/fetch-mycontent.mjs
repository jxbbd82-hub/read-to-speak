// Fetches English captions for MY CONTENT videos and writes
// src/data/my-content-transcripts.json so the full lesson flow opens even
// when YouTube blocks live caption requests from the host.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { myContentLessons } from "../src/data/myContent.ts";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "src/data/my-content-transcripts.json";
const result = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const clients = [
  { key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w", c: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "en-US", gl: "US" } },
  { key: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", c: { clientName: "ANDROID_VR", clientVersion: "1.60.19", deviceMake: "Oculus", deviceModel: "Quest 3", androidSdkVersion: 32, hl: "en-US", gl: "US" } },
  { key: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc", c: { clientName: "IOS", clientVersion: "19.45.4", deviceMake: "Apple", deviceModel: "iPhone16,2", hl: "en-US", gl: "US" } },
];

const dec = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

async function getCues(id) {
  for (const cl of clients) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${cl.key}&prettyPrint=false`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ context: { client: cl.c }, videoId: id }), signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) break;
        const j = await r.json();
        const tracks = j?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
        if (!tracks.length) break;
        const t = tracks.find((x) => (x.languageCode || "").startsWith("en")) ?? tracks[0];
        let xml = "";
        for (const suffix of ["", "&fmt=srv3"]) {
          if (xml.startsWith("<?xml") || xml.startsWith("<timedtext")) break;
          await sleep(attempt ? 3000 : 0);
          xml = await (await fetch(t.baseUrl + suffix, { signal: AbortSignal.timeout(10000) })).text();
        }
        if (!xml.startsWith("<?xml") && !xml.startsWith("<timedtext")) break;
        const cues = [];
        const re = /<p\s+([^>]*)>([\s\S]*?)<\/p>/g;
        let m;
        while ((m = re.exec(xml))) {
          const tt = +(m[1].match(/\bt="(\d+)"/) || [, 0])[1];
          const dd = +(m[1].match(/\bd="(\d+)"/) || [, 2000])[1];
          let text = dec(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
          text = text.replace(/^(?:[A-Z][A-Z .'&-]{1,28}:\s*)+/, "").replace(/\[[^\]]*\]/g, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
          if (text) cues.push({ t: tt, d: dd, text });
        }
        if (cues.join(" ").split(/\s+/).length >= 40) {
          return { title: j?.videoDetails?.title ?? id, author: j?.videoDetails?.author ?? "YouTube", cues };
        }
        break;
      } catch {
        await sleep(1500);
      }
    }
    await sleep(1000);
  }
  return null;
}

for (const lesson of myContentLessons) {
  if (result[lesson.videoId]?.cues?.length) { console.log("cached", lesson.number, lesson.videoId); continue; }
  console.log("fetching", lesson.number, lesson.videoId, lesson.title);
  const data = await getCues(lesson.videoId);
  if (data) {
    result[lesson.videoId] = { title: data.title, author: data.author, cues: data.cues };
    writeFileSync(OUT, JSON.stringify(result, null, 1));
    console.log("  OK", data.cues.length, "cues");
  } else {
    console.log("  FAIL (will retry later)");
  }
  await sleep(2500);
}
const got = myContentLessons.filter((l) => result[l.videoId]?.cues?.length).length;
console.log(`my-content baked: ${got}/${myContentLessons.length}`);
