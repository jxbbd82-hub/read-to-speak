// Patiently fetches timed captions for every manifest video and writes
// results into the PROJECT (src/data/captions-cache.json) after each success,
// so partial runs survive restarts. Uses several InnerTube clients with
// delays to avoid YouTube rate limits. Re-run until it reports "all cached".
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const manifest = require("../src/data/manifest-targets.json");

const CACHE = "src/data/captions-cache.json";
mkdirSync("src/data", { recursive: true });
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clients = [
  { key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w", c: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "en-US", gl: "US" } },
  { key: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", c: { clientName: "ANDROID_VR", clientVersion: "1.60.19", deviceMake: "Oculus", deviceModel: "Quest 3", androidSdkVersion: 32, hl: "en-US", gl: "US" } },
  { key: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc", c: { clientName: "IOS", clientVersion: "19.45.4", deviceMake: "Apple", deviceModel: "iPhone16,2", hl: "en-US", gl: "US" } },
  { key: "AIzaSyDCU3wn7gsTdpMJmoxvOPp6CfmgpH7z1k0", c: { clientName: "TVHTML5", clientVersion: "7.20240726.13.00", hl: "en-US", gl: "US" } },
];

const dec = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

async function fetchOne(id) {
  for (const cl of clients) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${cl.key}&prettyPrint=false`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ context: { client: cl.c }, videoId: id, playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" } } }),
          signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) break;
        const j = await r.json();
        const tracks = j?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
        if (!tracks.length) {
          if (j?.playabilityStatus?.status === "LOGIN_REQUIRED") { await sleep(2200); break; }
          break;
        }
        const t = tracks.find((x) => (x.languageCode || "").toLowerCase().startsWith("en")) ?? tracks[0];
        // The player call succeeds but timedtext is rate-limited
        // intermittently ("Sorry..." page). Retry the signed URL a few times.
        let xml = "";
        for (const [suffix, wait] of [["", 0], ["&fmt=srv3", 4000], ["", 8000], ["&fmt=srv3", 12000]]) {
          if (wait) await sleep(wait);
          try {
            xml = await (await fetch(t.baseUrl + suffix, { signal: AbortSignal.timeout(10000), headers: { "accept-language": "en-US,en;q=0.9" } })).text();
          } catch { xml = ""; }
          if (xml.startsWith("<?xml") || xml.startsWith("<timedtext")) break;
        }
        if (!xml.startsWith("<?xml") && !xml.startsWith("<timedtext")) { await sleep(1500); break; }
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
        if (cues.join(" ").split(/\s+/).length >= 30) {
          return { title: j?.videoDetails?.title ?? id, author: j?.videoDetails?.author ?? "YouTube", cues };
        }
        break;
      } catch {
        await sleep(900);
      }
    }
    await sleep(1200);
  }
  return null;
}

const ids = [...new Set(Object.values(manifest).flat().map((v) => v.id))];
const missing = ids.filter((id) => !cache[id]);
console.log(`total ${ids.length}, cached ${ids.length - missing.length}, fetching ${missing.length}`);
let ok = 0, fail = 0;
for (const id of missing) {
  process.stderr.write(`-> ${id}\n`);
  const data = await fetchOne(id);
  if (data) { cache[id] = data; writeFileSync(CACHE, JSON.stringify(cache)); ok++; console.log(`OK ${id} (${data.cues.length} cues)`); }
  else { fail++; console.log(`FAIL ${id}`); }
  await sleep(1400);
}
const stillMissing = ids.filter((id) => !cache[id]);
console.log(`done. fetched ${ok}, failed this run ${fail}, still missing ${stillMissing.length}`);
if (stillMissing.length) console.log(stillMissing.join("\n"));
