// Generates level-matched, video-aligned speaking lessons from real YouTube
// captions. Each lesson is a timed SCENE of one real, entertaining clip:
// the audio passage IS the scene's dialogue, chunks/shadows come from it,
// and the embedded video starts at that scene.
import { writeFileSync, mkdirSync, readFileSync, existsSync, appendFileSync } from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE = "/tmp/lesson-cues.json";
const onlyLevel = process.argv[2];

const MANIFEST = [
  // ---- A1: very simple kids / animation ----
  { id: "nhDIlSdpV-c", level: "A1" },
  { id: "h2PbncQq0jM", level: "A1" },
  { id: "8266-l00Ows", level: "A1" },
  { id: "0EYibOCBRIY", level: "A1" },
  { id: "9pJsDDw6LkA", level: "A1" },
  { id: "fPohqlw6QzE", level: "A1" },
  { id: "ea3kMif5bro", level: "A1" },
  { id: "CEKc4vKzO_s", level: "A1" },
  // ---- A2: animated movie scenes ----
  { id: "m95JdpLzkQY", level: "A2" },
  { id: "Onc0P6sFcsc", level: "A2" },
  { id: "A05n32Bl0aY", level: "A2" },
  { id: "RxHPtsIYBWQ", level: "A2" },
  { id: "AC7u6hjHFrQ", level: "A2" },
  { id: "VNSYBeSjWb4", level: "A2" },
  { id: "dwzxYwbqHAQ", level: "A2" },
  { id: "qTSDL94_Y7M", level: "A2" },
  // ---- B1: light game shows / family comedy ----
  { id: "Xe-7dLntOeQ", level: "B1" },
  { id: "XeBE7bFqOgU", level: "B1" },
  { id: "p8-uEJ11GAM", level: "B1" },
  { id: "DrXEXZhAo1A", level: "B1" },
  { id: "OqdWdbmLya8", level: "B1" },
  { id: "ThEpPnmBYMw", level: "B1" },
  { id: "XHrw3AFW0Z0", level: "B1" },
  { id: "TjpkMfTBVQs", level: "B1" },
  // ---- B2: storytelling interviews ----
  { id: "eF7zdv4HWVo", level: "B2" },
  { id: "OUzW2ssrgtU", level: "B2" },
  { id: "s_m22BxJE08", level: "B2" },
  { id: "JakSLWXuEDE", level: "B2" },
  { id: "RZ7RpzRia78", level: "B2" },
  { id: "eeumL7Fz-8M", level: "B2" },
  { id: "lEgqCXJ5Jk0", level: "B2" },
  { id: "34ttspXxYlw", level: "B2" },
  // ---- C1: fast, layered talk ----
  { id: "iqdSagycCWc", level: "C1" },
  { id: "hTpCbSat1-0", level: "C1" },
  { id: "Sch-HhW4dB0", level: "C1" },
  { id: "xs30aF5lnTk", level: "C1" },
  { id: "ad7HqXEc2Sc", level: "C1" },
  { id: "AdKUJxjn-R8", level: "C1" },
  { id: "qpnNsSyDw-g", level: "C1" },
  { id: "9-5SMpg7Q0k", level: "C1" },
  // ---- C2: densest wordplay / argument ----
  { id: "iqdSagycCWc", level: "C2" },
  { id: "Sch-HhW4dB0", level: "C2" },
  { id: "xs30aF5lnTk", level: "C2" },
  { id: "qYvXk_bqlBk", level: "C2" },
  { id: "khkJkR-ipfw", level: "C2" },
  { id: "arj7oStGLkU", level: "C2" },
  { id: "tF7YLGpOoz8", level: "C2" },
  { id: "_X0mgOOSpLU", level: "C2" },
];

const KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const CTX = { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "en-US", gl: "US" } };
const clients = [
  { key: KEY, body: { context: CTX } },
  { key: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", body: { context: { client: { clientName: "ANDROID_VR", clientVersion: "1.60.19", deviceMake: "Oculus", deviceModel: "Quest 3", androidSdkVersion: 32, hl: "en-US", gl: "US" } } } },
  { key: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc", body: { context: { client: { clientName: "IOS", clientVersion: "19.45.4", deviceMake: "Apple", deviceModel: "iPhone16,2", hl: "en-US", gl: "US" } } } },
  { key: "AIzaSyDCU3wn7gsTdpMJmoxvOPp6CfmgpH7z1k0", body: { context: { client: { clientName: "TVHTML5", clientVersion: "7.20240726.13.00", hl: "en-US", gl: "US" } } } },
];

const dec = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

async function getCues(id) {
  for (const c of clients) {
    for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${c.key}&prettyPrint=false`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...c.body, videoId: id, playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" } } }),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const tracks = j?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (!tracks.length) continue;
      const t = tracks.find((x) => (x.languageCode || "").toLowerCase().startsWith("en")) ?? tracks[0];
      const xml = await (await fetch(t.baseUrl)).text();
      if (!xml.startsWith("<?xml") && !xml.startsWith("<timedtext")) continue;
      const cues = [];
      const re = /<p\s+([^>]*)>([\s\S]*?)<\/p>/g;
      let m;
      while ((m = re.exec(xml))) {
        const attrs = m[1];
        const tMatch = attrs.match(/t="(\d+)"/);
        const dMatch = attrs.match(/d="(\d+)"/);
        let text = dec(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
        text = text.replace(/^(?:[A-Z][A-Z .'&-]{1,28}:\s*)+/, "").replace(/\[[^\]]*\]/g, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
        if (text) cues.push({ t: +(tMatch?.[1] ?? 0), d: +(dMatch?.[1] ?? 2000), text });
      }
      if (cues.length) return { cues, title: j?.videoDetails?.title ?? id, author: j?.videoDetails?.author ?? "YouTube", len: +(j?.videoDetails?.lengthSeconds ?? 0) };
      if (j?.playabilityStatus?.status === "LOGIN_REQUIRED") { await sleep(4000 + attempt * 3000); break; } // switch client then retry
    } catch { await sleep(1500); }
    }
  }
  return null;
}

/* ---- spoken-chunk dictionary (same family as the app) ---- */
const CHUNKS = [
  ["you know what", "used before a new decision or thought"], ["i mean", "used to explain or correct yourself"], ["to be honest", "before a direct, honest opinion"],
  ["the thing is", "introduce the main point or problem"], ["at the end of the day", "when everything is considered"], ["it turns out", "the result was surprising"],
  ["i have no idea", "i really don't know"], ["kind of", "a little; in some way"], ["sort of", "a little; approximately"], ["a little bit", "a small amount"],
  ["pretty much", "almost completely; basically"], ["for some reason", "for an unknown reason"], ["by the way", "add an extra point"], ["speaking of", "connect to a related topic"],
  ["what do you mean", "ask someone to explain"], ["are you kidding", "show surprise or disbelief"], ["that makes sense", "i understand the reason"], ["sounds good", "i agree with the plan"],
  ["that's a good point", "someone's idea is reasonable"], ["i get it", "i understand"], ["no big deal", "not a serious problem"], ["no way", "strong surprise or refusal"],
  ["come on", "urge someone or show disbelief"], ["hold on", "wait a moment"], ["hang on", "wait a moment"], ["give me a second", "wait a short moment"],
  ["let me think", "give me a moment to answer"], ["let me see", "give me a moment to check"], ["what's going on", "ask what is happening"],
  ["i feel like", "share a feeling or impression"], ["i guess", "an unsure opinion"], ["i wonder", "think about a question"], ["i used to", "a past habit or situation"],
  ["i was like", "introduce a reaction or quote in a story"], ["all of a sudden", "suddenly"], ["right away", "immediately"], ["at first", "at the beginning"],
  ["in the end", "finally; after everything"], ["work out", "end successfully; find a solution"], ["figure out", "understand or solve"], ["find out", "discover"],
  ["show up", "arrive or appear"], ["end up", "finally be in a situation"], ["deal with", "handle a situation"], ["get over", "recover from something"],
  ["get along", "have a good relationship"], ["look forward to", "feel excited about something ahead"], ["make sure", "check that something is done"],
  ["take care of", "look after; handle"], ["get rid of", "remove something"], ["it depends", "the answer changes with the situation"], ["it's up to you", "you decide"],
  ["as long as", "only if a condition is true"], ["even though", "despite the fact that"], ["rather than", "instead of"], ["not really", "a soft way to say no"],
  ["of course", "certainly; as expected"], ["for sure", "definitely"], ["what happened", "ask about an event"], ["how did you", "ask the way something happened"],
  ["are you serious", "show surprised disbelief"], ["i can't believe", "show strong surprise"], ["turns out", "the surprising result is"], ["check it out", "go see or try something"],
  ["take it easy", "relax; go slowly"], ["hang out", "spend relaxed time together"], ["sleep in", "wake up later than usual"], ["my bad", "casual apology for my mistake"],
  ["got it", "i understand"], ["here you go", "said when giving something"], ["no worries", "it's okay; don't worry"], ["sounds like", "it seems to be the case"],
  ["a lot of", "many or much"], ["every once in a while", "sometimes, not often"], ["i'm just saying", "soften an opinion"], ["you know", "filler that keeps a turn going"],
  ["like", "filler / introduce a quote in stories"], ["basically", "said simply; in short"], ["actually", "in fact; used to correct or add"], ["honestly", "before a frank opinion"],
];

const CFG = {
  A1: { words: 80, shadows: 4, chunks: 6, maxSent: 9 },
  A2: { words: 110, shadows: 5, chunks: 7, maxSent: 13 },
  B1: { words: 150, shadows: 6, chunks: 8, maxSent: 18 },
  B2: { words: 185, shadows: 6, chunks: 8, maxSent: 24 },
  C1: { words: 220, shadows: 7, chunks: 9, maxSent: 30 },
  C2: { words: 255, shadows: 8, chunks: 10, maxSent: 40 },
};
const ACCENT = { A1: "emerald", A2: "apricot", B1: "ink", B2: "emerald", C1: "apricot", C2: "ink" };

const FRAMES = {
  A1: ["I see…", "At first…", "Then…", "In the end…"],
  A2: ["It starts when…", "At first… then…", "It's funny because…", "In the end…"],
  B1: ["What stood out was…", "I think they meant…", "That reminds me of…", "I would probably…"],
  B2: ["The moment that matters is… because…", "There are two ways to see this…", "This connects to… because…", "If I were in that situation…"],
  C1: ["The speaker seems to assume…", "What's interesting is the subtext…", "I'd qualify that by saying…", "A broader implication is…"],
  C2: ["On the surface… yet beneath it…", "The implicit claim here is…", "I'd distinguish between… and…", "Paradoxically, this suggests…"],
};
const SPEAK_TARGET = {
  A1: "Retell the scene in 20 seconds with simple sentences.", A2: "Retell it in 30 seconds, then give one personal reaction.",
  B1: "Retell the scene and react for 45–60 seconds.", B2: "Retell, interpret, and compare for one minute.",
  C1: "Analyze the scene and its subtext for one minute.", C2: "Build a nuanced 90-second interpretation.",
};
const THINK = {
  A1: ["Name three things you see in the scene in English.", "Narrate the scene in your head: First… Then… Next…", "Think: What would I say in this scene? Say the simple version."],
  A2: ["Describe the scene in three short English sentences in your head.", "When a word is missing, think of a simpler way to say it.", "Replay the funniest moment and describe it to yourself in English."],
  B1: ["Narrate what happens without translating from your language.", "Predict the next line in English before they say it.", "Turn one line into a sentence about your own life."],
  B2: ["Summarize each person's point silently in English.", "Notice one phrase a speaker repeats; think when you'd use it.", "Argue the opposite side of the scene in your head."],
  C1: ["Infer what each speaker wants but doesn't say.", "Restate the subtext of one exchange in your own words.", "Think of a counterexample to the speaker's assumption."],
  C2: ["Identify the unstated assumption behind the humor.", "Reformulate the scene in a different register in your head.", "Connect the moment to a broader social pattern."],
};
const WRITE = {
  A1: "Write 3 simple sentences retelling the scene, then one sentence about yourself.",
  A2: "Write 5 sentences: what happened, the funny moment, and your reaction.",
  B1: "Write a 60-word paragraph retelling the scene, then change one detail to make it your story.",
  B2: "Write 90 words: summary (2 sentences), interpretation, and a personal comparison.",
  C1: "Write 120 words analyzing one speaker's choices and implied meaning.",
  C2: "Write 150 words arguing an interpretation, including a counterpoint.",
};
const VOICE = (n) => (n % 2 ? "andrew" : "ava");

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 2) ?? [];
}

function buildChunks(text, level, cfg) {
  const lower = text.toLowerCase();
  const sents = splitSentences(text);
  const out = [];
  for (const [phrase, meaning] of CHUNKS) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(^|[^a-z])${esc}(?![a-z])`, "i");
    const mm = rx.exec(lower);
    if (!mm) continue;
    const ctx = sents.find((s) => rx.test(s.toLowerCase())) ?? text.slice(Math.max(0, mm.index - 30), mm.index + phrase.length + 70);
    out.push({ word: phrase, part_of_speech: "spoken chunk", meaning, example: ctx.slice(0, 170) });
    if (out.length >= cfg.chunks) break;
  }
  // fill with reusable sentence openings / short lines
  if (out.length < cfg.chunks) {
    for (const s of sents) {
      const w = s.split(/\s+/).slice(0, 5).join(" ").replace(/[.,;:]+$/, "");
      if (w.split(/\s+/).length < 3) continue;
      if (!out.some((x) => x.word.toLowerCase() === w.toLowerCase())) out.push({ word: w, part_of_speech: "sentence starter", meaning: "a natural way to start a sentence from this scene", example: s.slice(0, 170) });
      if (out.length >= cfg.chunks) break;
    }
  }
  return out;
}

function pickShadows(cues, cfg) {
  const seen = new Set();
  const out = [];
  for (const c of cues) {
    const n = c.text.split(/\s+/).length;
    if (n < 3 || n > cfg.maxSent) continue;
    const key = c.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c.text);
    if (out.length >= cfg.shadows) break;
  }
  return out.slice(0, cfg.shadows);
}

function segment(cues, level) {
  const cfg = CFG[level];
  const segments = [];
  let cur = [], words = 0, start = cues[0]?.t ?? 0;
  const flush = () => {
    if (!cur.length) return;
    const text = cur.join(" ").replace(/\s+/g, " ").trim();
    const segCues = cur.map((_, i) => null); // placeholder
    segments.push({ start, text });
    cur = []; words = 0;
  };
  cues.forEach((c, i) => {
    if (!cur.length) start = c.t;
    cur.push(c.text);
    words += c.text.split(/\s+/).length;
    const endsSentence = /[.!?]$/.test(c.text.trim());
    if (words >= cfg.words && endsSentence) flush();
    else if (words >= cfg.words * 1.35) flush();
  });
  flush();
  // attach raw cue arrays per segment for shadow selection: re-walk with same logic
  const result = [];
  let bucket = [], w = 0, st = cues[0]?.t ?? 0;
  cues.forEach((c) => {
    if (!bucket.length) st = c.t;
    bucket.push(c); w += c.text.split(/\s+/).length;
    const done = (w >= cfg.words && /[.!?]$/.test(c.text.trim())) || w >= cfg.words * 1.35;
    if (done) { result.push({ start: st, cues: bucket }); bucket = []; w = 0; }
  });
  if (bucket.length) result.push({ start: st, cues: bucket });
  return result.filter((s) => s.cues.join(" ").split(/\s+/).length >= cfg.words * 0.6);
}

const cleanTitle = (t) => t.replace(/\s*[\|\-–—]\s*(Official|HD|Movie\s?CLIP|CLIP|Clip)[^|]*$/i, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim().slice(0, 60);

async function main() {
  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
  const byLevel = { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] };
  const failures = [];
  const wanted = MANIFEST.filter((m) => !onlyLevel || m.level === onlyLevel);
  for (const m of wanted) {
    let data = cache[m.id];
    if (!data) {
      process.stderr.write(`fetch ${m.id} (${m.level})...\n`);
      data = await getCues(m.id);
      await sleep(2200);
      if (data && data.cues.join(" ").split(/\s+/).length >= 40) { cache[m.id] = data; writeFileSync(CACHE, JSON.stringify(cache)); }
    }
    if (!data || data.cues.join(" ").split(/\s+/).length < 40) { failures.push(m.id); continue; }
    const segs = segment(data.cues, m.level);
    segs.forEach((seg, idx) => {
      byLevel[m.level].push({ ...m, ...data, segStart: seg.start, segCues: seg.cues, part: idx + 1, parts: segs.length });
    });
  }

  // Merge with previously generated courses when building one level at a time.
  const OUT = "src/data/generated-lessons.json";
  const courses = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    if (onlyLevel && level !== onlyLevel) continue;
    const cfg = CFG[level];
    const items = byLevel[level].slice(0, 12).map((s, i) => {
      const text = s.segCues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
      const shadows = pickShadows(s.segCues, cfg);
      const chunks = buildChunks(text, level, cfg);
      const multi = s.parts > 1;
      const titleBase = cleanTitle(s.title);
      return {
        key: `${level.toLowerCase()}-unit-${i + 1}`, kind: "unit", number: i + 1, level,
        title: multi ? `${titleBase} · ${s.part}` : titleBase,
        topic: s.author.replace(/ - Topic$/, ""),
        summary: SPEAK_TARGET[level],
        grammar: `Steal ${cfg.chunks} real phrases and ${cfg.shadows} lines from this scene.`,
        grammarNote: `This is a real ${s.author} scene. Listen for how people actually react — short phrases, fillers, and turn-taking.\nNatural lines to copy:\n${shadows.slice(0, 3).map((x) => `→  ${x}`).join("\n")}\nTry it now:\nReplay one exchange, then say the same reaction in your own situation.`,
        duration: null, accent: ACCENT[level], voice: VOICE(i),
        videoId: s.id, videoTitle: s.title, channel: s.author, videoStart: Math.floor(s.segStart / 1000),
        passage: [text],
        shadowLines: shadows,
        vocabulary: chunks,
        speakingPrompts: [
          "Who is in this scene, and what actually happens?",
          "What is the funniest or most surprising moment, and why?",
          `Which phrase would you use in real life, and when? (${chunks[0]?.word ?? "pick one"})`,
          level === "A1" || level === "A2" ? "Retell the scene out loud in your own words." : "How would this scene go in your country or your life?",
        ],
        answerFrames: FRAMES[level],
        writingPrompt: WRITE[level],
        thinkPrompts: THINK[level],
      };
    });
    const existing = courses.findIndex((c) => c.level === level);
    if (existing >= 0) courses[existing] = { level, items }; else courses.push({ level, items });
    process.stderr.write(`${level}: ${items.length} lessons\n`);
  }
  courses.sort((a, b) => ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(a.level) - ["A1", "A2", "A2", "B1", "B2", "C1", "C2"].indexOf(b.level));

  // Keyed fallback map consumed by /api/lesson when YouTube blocks live fetch.
  const fallback = {};
  for (const c of courses) for (const it of c.items) {
    fallback[`${c.level}|${it.videoId}|${it.key.split("-").pop() - 1}`] = {
      title: it.title.replace(/ · \d+$/, ""), author: it.topic, start: it.videoStart ?? 0,
      passage: it.passage.join(" "), chunks: it.vocabulary, shadows: it.shadowLines,
      questions: it.speakingPrompts, frames: it.answerFrames,
      writingPrompt: it.writingPrompt, thinkPrompts: it.thinkPrompts,
      wordCount: it.passage.join(" ").split(/\s+/).length,
    };
  }

  mkdirSync("src/data", { recursive: true });
  writeFileSync(OUT, JSON.stringify(courses, null, 1));
  const PREV = "src/data/lesson-fallback.json";
  const prevFallback = existsSync(PREV) ? JSON.parse(readFileSync(PREV, "utf8")) : {};
  writeFileSync(PREV, JSON.stringify({ ...prevFallback, ...fallback }, null, 1));
  appendFileSync("/tmp/lesson-failures.log", (failures.join(", ") || "none") + "\n");
  console.log("failures:", failures.join(", ") || "none");
}
main();
