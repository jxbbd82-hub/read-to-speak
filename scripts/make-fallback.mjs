// Builds src/data/lesson-fallback.json — fully baked scene lessons from
// cached captions — so /api/lesson always returns audio/chunks/shadow/speak
// even when YouTube blocks live caption requests.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const manifest = require("../src/data/manifest-targets.json");

const CACHE_PATH = "src/data/captions-cache.json";
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};

const CFG = {
  A1: { words: 80, shadows: 4, chunks: 6, maxSent: 9 },
  A2: { words: 110, shadows: 5, chunks: 7, maxSent: 13 },
  B1: { words: 150, shadows: 6, chunks: 8, maxSent: 18 },
  B2: { words: 185, shadows: 6, chunks: 8, maxSent: 24 },
  C1: { words: 220, shadows: 7, chunks: 9, maxSent: 30 },
  C2: { words: 255, shadows: 8, chunks: 10, maxSent: 40 },
};
const CHUNKS = [
  ["you know what","used before a new decision or thought"],["i mean","used to explain or correct yourself"],["to be honest","before a direct, honest opinion"],["the thing is","introduce the main point or problem"],["at the end of the day","when everything is considered"],["it turns out","the result was surprising"],["i have no idea","i really don't know"],["kind of","a little; in some way"],["sort of","a little; approximately"],["a little bit","a small amount"],["pretty much","almost completely; basically"],["for some reason","for an unknown reason"],["by the way","add an extra point"],["speaking of","connect to a related topic"],["what do you mean","ask someone to explain"],["are you kidding","show surprise or disbelief"],["that makes sense","i understand the reason"],["sounds good","i agree with the plan"],["that's a good point","someone's idea is reasonable"],["i get it","i understand"],["no big deal","not a serious problem"],["no way","strong surprise or refusal"],["come on","urge someone or show disbelief"],["hold on","wait a moment"],["hang on","wait a moment"],["give me a second","wait a short moment"],["let me think","give me a moment to answer"],["what's going on","ask what is happening"],["i feel like","share a feeling or impression"],["i guess","an unsure opinion"],["i wonder","think about a question"],["i used to","a past habit or situation"],["i was like","introduce a reaction or quote"],["all of a sudden","suddenly"],["right away","immediately"],["at first","at the beginning"],["in the end","finally; after everything"],["work out","end successfully; solve"],["figure out","understand or solve"],["find out","discover"],["show up","arrive or appear"],["end up","finally be in a situation"],["deal with","handle a situation"],["get over","recover"],["get along","have a good relationship"],["look forward to","feel excited about"],["make sure","check that something is done"],["take care of","look after; handle"],["get rid of","remove"],["it depends","the answer changes"],["it's up to you","you decide"],["as long as","only if"],["even though","despite the fact"],["rather than","instead of"],["not really","a soft no"],["of course","certainly"],["for sure","definitely"],["what happened","ask about an event"],["are you serious","surprised disbelief"],["i can't believe","strong surprise"],["check it out","go see or try"],["take it easy","relax; go slowly"],["hang out","spend relaxed time"],["sleep in","wake up later"],["my bad","casual apology"],["got it","i understand"],["here you go","said when giving something"],["no worries","it's okay"],["sounds like","it seems"],["i'm just saying","soften an opinion"],["actually","in fact; correct or add"],["honestly","before a frank opinion"],["gonna","going to — fast American speech"],["wanna","want to — fast American speech"],["gotta","have got to; must"],["kinda","kind of"],
];
const FRAMES = {
  A1: ["I see…","At first…","Then…","In the end…"],
  A2: ["It starts when…","At first… then…","It's funny because…","In the end…"],
  B1: ["What stood out was…","I think they meant…","That reminds me of…","I would probably…"],
  B2: ["The moment that matters is… because…","There are two ways to see this…","This connects to… because…","If I were in that situation…"],
  C1: ["The speaker seems to assume…","What's interesting is the subtext…","I'd qualify that by saying…","A broader implication is…"],
  C2: ["On the surface… yet beneath it…","The implicit claim here is…","I'd distinguish between… and…","Paradoxically, this suggests…"],
};
const WRITE = { A1:"Write 3 simple sentences retelling the scene, then one sentence about yourself.", A2:"Write 5 sentences: what happened, the funny moment, and your reaction.", B1:"Write a 60-word paragraph retelling the scene, then change one detail to make it your story.", B2:"Write 90 words: a 2-sentence summary, an interpretation, and a personal comparison.", C1:"Write 120 words analyzing one speaker's choices and implied meaning.", C2:"Write 150 words arguing an interpretation, including a counterpoint." };
const THINK = {
  A1:["Name three things you see in the scene, in English.","Narrate in your head: First… Then… Next…","Think what you would say — the simple version."],
  A2:["Describe the scene in three short English sentences in your head.","When a word is missing, think of a simpler way to say it.","Replay the funniest moment and describe it to yourself."],
  B1:["Narrate what happens without translating from your language.","Predict the next line in English before they say it.","Turn one line into a sentence about your own life."],
  B2:["Summarize each person's point silently in English.","Notice one repeated phrase; think when you'd use it.","Argue the opposite side of the scene in your head."],
  C1:["Infer what each speaker wants but doesn't say.","Restate the subtext of one exchange in your own words.","Think of a counterexample to the speaker's assumption."],
  C2:["Identify the unstated assumption behind the humor.","Reformulate the scene in a different register in your head.","Connect the moment to a broader social pattern."],
};
const sents = (t) => t.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s)=>s.trim()).filter((s)=>s.split(/\s+/).length>=2) ?? [];
function functionLabel(s0){const l=s0.trim().toLowerCase();
 if(/^(what|who|where|when|why|how|do you|did you|are you|can you|is it|is there)\b/.test(l))return"ask a question — open or check something";
 if(/^(yes|yeah|yep|sure|of course|okay|ok|right|exactly|totally|absolutely)\b/.test(l))return"agree or confirm casually";
 if(/^(no|nope|nah|never|not really|i don'?t|i can'?t)\b/.test(l))return"refuse or disagree softly";
 if(/^(sorry|my bad|excuse me|apolog)/.test(l))return"apologize for a small mistake";
 if(/^(thanks|thank you|appreciate)\b/.test(l))return"thank someone in everyday speech";
 if(/^(hi|hey|hello|yo|morning|good (morning|afternoon|evening))\b/.test(l))return"greet and start a conversation";
 if(/^(bye|goodbye|see you|see ya|later|good night)\b/.test(l))return"close a conversation naturally";
 if(/^(wait|hold on|hang on|give me|let me)\b/.test(l))return"pause to buy a moment to think";
 if(/^(because|so|since|therefore|that'?s why)\b/.test(l))return"give a reason or explain why";
 if(/^(then|after|next|later|finally|in the end|at first)\b/.test(l))return"move a story forward in time";
 if(/^(but|however|although|even though|though)\b/.test(l))return"contrast two ideas or add a turn";
 if(/^(if|when|unless|as long as)\b/.test(l))return"set a condition before the main idea";
 if(/^(i think|i feel|i guess|i mean|honestly|to be honest)\b/.test(l))return"share an opinion or soften a statement";
 if(/^(i'?m|i am|i was|i'?ve|i have)\b/.test(l))return"describe yourself or a reaction";
 if(/^(look|listen|watch|come on|let'?s)\b/.test(l))return"direct attention or suggest doing something";
 return"react and keep the conversation going";}
function buildChunks(text, level, wholeText=""){
  const cfg=CFG[level], lower=text.toLowerCase(), ss=sents(text), out=[];
  const usedMeanings=new Set();
  const addFrom=(source)=>{
    const sLower=source.toLowerCase(), sSs=sents(source);
    for(const [phrase,meaning] of CHUNKS){
      if(out.length>=cfg.chunks)break;
      if(usedMeanings.has(meaning))continue;
      const esc=phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const rx=new RegExp(`(^|[^a-z])${esc}(?![a-z])`,"i"), mm=rx.exec(sLower);
      if(!mm)continue;
      if(out.some((x)=>x.word.toLowerCase()===phrase.toLowerCase()))continue;
      const ctx=sSs.find((s)=>rx.test(s.toLowerCase())) ?? source.slice(Math.max(0,mm.index-30),mm.index+phrase.length+70);
      out.push({word:phrase,part_of_speech:"spoken chunk",meaning,example:ctx.slice(0,170)});usedMeanings.add(meaning);
    }
    const clean=(s)=>!/[A-Z]{3,}/.test(s) && (s.match(/[a-z]/g)||[]).length > s.replace(/[a-z]/g,"").length;
    for(const s of sSs){ if(out.length>=cfg.chunks)break;
      const w=s.split(/\s+/).slice(0,5).join(" ").replace(/[.,;:]+$/,"");
      if(w.split(/\s+/).length<3||!clean(s))continue;
      const meaning=functionLabel(s);
      if(out.some((x)=>x.word.toLowerCase()===w.toLowerCase())||usedMeanings.has(meaning))continue;
      out.push({word:w,part_of_speech:"sentence starter",meaning,example:s.slice(0,170)});usedMeanings.add(meaning);
    }
  };
  addFrom(text);
  if(out.length<cfg.chunks && wholeText && wholeText!==text) addFrom(wholeText);
  return out;
}
function pickShadows(cues,level){const cfg=CFG[level],seen=new Set(),out=[];for(const c of cues){const n=c.text.split(/\s+/).length;if(n<3||n>cfg.maxSent)continue;const k=c.text.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(c.text);if(out.length>=cfg.shadows)break;}return out;}
function segments(cues,level,wordOverride){const cfg={...CFG[level],...(wordOverride?{words:wordOverride}:{})},res=[];let b=[],w=0,st=cues[0]?.t??0;for(const c of cues){if(!b.length)st=c.t;b.push(c);w+=c.text.split(/\s+/).length;const done=(w>=cfg.words&&/[.!?]$/.test(c.text.trim()))||w>=cfg.words*1.35;if(done){res.push({start:st,cues:b});b=[];w=0;}}if(b.length&&b.join(" ").split(/\s+/).length>=cfg.words*0.55)res.push({start:st,cues:b});if(res.length>1){const last=res.at(-1);if(last.cues.join(" ").split(/\s+/).length<cfg.words*0.55){res.at(-2).cues.push(...last.cues);res.pop();}}return res;}
function unitsForLevel(level){const pool=manifest[level]??[],plan=[];for(const v of pool)for(let s=0;s<v.parts;s++)plan.push({videoId:v.id,seg:s});let i=0;while(plan.length<12&&pool.length){const v=pool[i%pool.length];plan.push({videoId:v.id,seg:v.parts+Math.floor(i/pool.length)});i++;}return plan.slice(0,12);}

const fallback={};const newManifest={};const missing=[];
const LEVELS=["A1","A2","B1","B2","C1","C2"];
const makeLesson=(level,cached,seg)=>(()=>{
  const text=seg.cues.map((c)=>c.text).join(" ").replace(/\s+/g," ").trim();
  const whole=cached.cues.map((c)=>c.text).join(" ").replace(/\s+/g," ").trim();
  return {
    title:cached.title,author:cached.author,start:Math.floor(seg.start/1000),passage:text,
    chunks:buildChunks(text,level,whole),shadows:pickShadows(seg.cues,level),
    questions:["Who is in this scene, and what actually happens?","What is the funniest or most surprising moment, and why?","Which phrase would you use in real life, and when?",level==="A1"||level==="A2"?"Retell the scene out loud in your own words.":"How would this same scene go in your country or your life?"],
    frames:FRAMES[level],writingPrompt:WRITE[level],thinkPrompts:THINK[level],wordCount:text.split(/\s+/).length,
  };
})();

// Videos that genuinely lack English captions are skipped.
const NO_ENGLISH = new Set(["ea3kMif5bro","AC7u6hjHFrQ","VNSYBeSjWb4","OUzW2ssrgtU","JakSLWXuEDE"]);
// Global allocation so one video is never reused across two levels.
const globallyUsed = new Set();
for(const level of LEVELS){
  const chosen=[];
  // This level's own target videos that have captions cached and English.
  const owned=(manifest[level]??[]).map(v=>v.id).filter((id)=>cache[id]&&!NO_ENGLISH.has(id));
  // Gather scenes only from videos owned by THIS level (no cross-level pool).
  const sceneList=[];
  for(const id of owned){
    if(globallyUsed.has(id))continue;
    for(const sg of segments(cache[id].cues,level)){if(sceneList.length>=12)break;sceneList.push({id,seg:sg});}
  }
  // If short, resegment this level's own cached videos smaller — never borrow
  // another level's videos. This keeps every level visually distinct.
  if(sceneList.length<12){
    sceneList.length=0;
    for(const id of owned){
      if(globallyUsed.has(id))continue;
      for(const sg of segments(cache[id].cues,level,55)){if(sceneList.length>=12)break;sceneList.push({id,seg:sg});}
    }
  }
  // Last resort: cached videos not owned or used by any level yet, longest first.
  if(sceneList.length<12){
    const leftovers=Object.entries(cache).sort((a,b)=>b[1].cues.map((x)=>x.text).join(" ").split(/\s+/).length-a[1].cues.map((x)=>x.text).join(" ").split(/\s+/).length).map(([id])=>id).filter((id)=>!globallyUsed.has(id)&&!NO_ENGLISH.has(id)&&!owned.includes(id));
    for(const id of leftovers){
      for(const sg of segments(cache[id].cues,level,55)){if(sceneList.length>=12)break;sceneList.push({id,seg:sg});}
    }
  }
  const perIndex=new Map();
  sceneList.forEach((sc)=>{
    const k=perIndex.get(sc.id)??0; perIndex.set(sc.id,k+1);
    fallback[`${level}|${sc.id}|${k}`]=makeLesson(level,cache[sc.id],sc.seg);
    globallyUsed.add(sc.id);
  });
  for(const [id,parts] of perIndex.entries())chosen.push({id,parts});
  newManifest[level]=chosen;
  if(sceneList.length<12)missing.push(`${level} has only ${sceneList.length}/12 scenes`);
}

writeFileSync("src/data/lesson-fallback.json",JSON.stringify(fallback,null,1));
writeFileSync("src/data/manifest-data.json",JSON.stringify(newManifest,null,2));
console.log("fallback lessons:",Object.keys(fallback).length);
for(const l of LEVELS)console.log(l,(newManifest[l]||[]).reduce((n,v)=>n+v.parts,0),"units from",(newManifest[l]||[]).length,"videos");
if(missing.length)console.log(missing.join("\n"));
