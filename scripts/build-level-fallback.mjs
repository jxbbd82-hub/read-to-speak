// Regenerates src/data/lesson-fallback.json for the new level curriculum.
// Each level uses real, clean short clips (animation at A1/A2; male TED /
// professional speakers B1+). Scenes are short (~90–160 words by level) and
// run through the same chunk/shadow builders as the rest of the app.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const manifest = require("../src/data/manifest-data.json");
const scenes = require("../src/data/my-content-transcripts.json");

// Map each level video to a set of source transcript keys (real clips).
const SOURCES = {
  h2PbncQq0jM: ["mc-08","mc-04","mc-56"],          // clean simple animated talk
  m95JdpLzkQY: ["mc-08","mc-04","mc-50"],          // Despicable Me simple
  Onc0P6sFcsc: ["mc-04","mc-56","mc-54"],
  wogrp3GNUM8: ["mc-03","mc-52","mc-59"],          // Toy Story
  UNP03fDSj1U: ["mc-01","mc-02","mc-14"],          // Matt Cutts
  V74AxCqOTvg: ["mc-10","mc-11","mc-18","mc-55"],  // Derek Sivers
  eIho2S0ZahI: ["mc-12","mc-13","mc-24","mc-38"],  // Julian Treasure
  "5MgBikgcWnY": ["mc-09","mc-17","mc-23","mc-29","mc-33","mc-29"], // Josh Kaufman
  "8KkKuTCFvzI": ["mc-05","mc-06","mc-19","mc-51","mc-53","mc-05","mc-06"], // Waldinger
  HjriwYrGL28: ["mc-16","mc-26","mc-32","mc-43","mc-60","mc-26","mc-32"], // Simon Sinek
  BSxg87CoOu4: ["mc-27","mc-34","mc-39","mc-40","mc-45","mc-59"],  // Futur present
  pa4u8KwpO0k: ["mc-22","mc-31","mc-35","mc-42","mc-48","mc-57"],  // Chris Do
};

const WORD_TARGET = { A1: 80, A2: 105, B1: 130, B2: 150, C1: 165, C2: 175 };

function sentences(text){return text.replace(/\s+/g,' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)??[];}

// Functional speaking chunks (kept aligned with the app's lessonBuilder)
const EVERY = [
 ["i need","express a need simply"],["i want","state what you want"],["let's","suggest doing something together"],
 ["it's okay","reassure someone"],["come on","encourage or urge someone"],["that's it","recognize the solution"],
 ["first","introduce the first step"],["then","add the next step"],["finally","add the last step"],
 ["one step at a time","calm things down"],["i've got you","reassure a friend"],["what if","propose an idea"],
 ["i remember","begin a memory"],["i notice","point something out"],["it turns out","reveal a result"],
 ["i learned","share something learned"],["the trick is","share a useful method"],["small and steady","describe consistency"],
 ["hold on","pause to check understanding"],["do you mean","clarify what someone said"],
 ["to be clear","confirm an important point"],["better than","compare two options"],
 ["people who","describe a group"],["it's about","explain the real point"],
 ["the main","introduce the most important point"],["instead","offer an alternative"],
 ["if you","give a condition or tip"],["before you","prepare the listener"],["the goal is","state the purpose"],
 ["the reason is","explain why"],["you can say","give an example phrase"],["in plain words","simplify an idea"],
 ["for example","give an example"],["notice","direct attention"],["value","describe worth"],
 ["the result","describe an outcome"],["protect","explain keeping something safe"],["calmly","describe a composed action"],
];
const CLIENT = [
 ["i'd suggest","recommend something politely"],["the reason is","give the key reason"],
 ["what i'm trying to achieve is","explain the goal first"],["let me walk you through it","guide a presentation"],
 ["the reason i went this direction is","justify a design choice"],["what do you think about","ask for an opinion"],
 ["we could try","offer an alternative gently"],["let's go back to the brief","refocus on agreed goals"],
 ["just to clarify","confirm understanding"],["so what you're saying is","repeat back a concern"],
 ["that makes sense","acknowledge an idea"],["i understand why","show empathy before disagreeing"],
 ["from the customer's point of view","explain through the end user"],["i'll deliver","promise a delivery clearly"],
 ["based on the goals","tie feedback to objectives"],["let's compare","invite a side-by-side decision"],
 ["the next step","state what happens next"],["i'll confirm in writing","set a clear follow-up"],
 ["it's a little outside the original scope","handle scope creep kindly"],["here's the trade-off","explain a choice"],
];

function chunksFor(text, level, isWork, fullTextRaw=""){
  const words = text.length;
  const fullSentences=fullTextRaw?sentences(fullTextRaw):[];
  const lower=text.toLowerCase(); const ss=sentences(text);
  const want = {A1:4,A2:5,B1:6,B2:7,C1:7,C2:8}[level]??6;
  const pool = isWork ? [...CLIENT,...EVERY] : EVERY;
  const out=[]; const used=new Set();
  for(const [phrase,meaning] of pool){
    if(out.length>=want)break;
    const esc=phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const rx=new RegExp(`(^|[^a-z])${esc}(?![a-z])`,"i");
    const m=rx.exec(lower);
    if(!m||used.has(phrase))continue;
    used.add(phrase);
    const ctx=ss.find(s=>rx.test(s.toLowerCase()))??text.slice(Math.max(0,m.index-25),m.index+phrase.length+70);
    out.push({word:phrase,part_of_speech:"speaking chunk",meaning,example:ctx.trim().slice(0,170)});
  }
  // functional sentence starters to top up
  const labels=[s=>/^(what|who|where|how|do you|did you|are you|can you|is)\b/.test(s.toLowerCase())?"ask a question to open or check":null,
    s=>/^(yes|sure|of course|okay|exactly|right)\b/.test(s.toLowerCase())?"agree or confirm naturally":null,
    s=>/^(because|so|the reason)\b/.test(s.toLowerCase())?"give a reason":null,
    s=>/^(then|first|finally|after)\b/.test(s.toLowerCase())?"order a story or steps":null,
    s=>/^(if|when)\b/.test(s.toLowerCase())?"set a condition":null,
    s=>/^(i think|i feel|i believe|to me)\b/.test(s.toLowerCase())?"share a personal opinion":null,
    s=>/^(i'?m|i was|i have)\b/.test(s.toLowerCase())?"describe your own experience":null];
  const usedMeanings=new Set(out.map(o=>o.meaning));
  const fillFrom=(list)=>{
    for(const s of list){ if(out.length>=want)break;
      let meaning=null;
      for(const fn of labels){const m=fn(s); if(m){meaning=m;break;}}
      if(!meaning) meaning="react or keep the conversation going in your own words";
      const w=s.split(/\s+/).slice(0,5).join(" ").replace(/[.,;:]+$/,"");
      if(w.split(/\s+/).length<2||used.has(w.toLowerCase()))continue;
      used.add(w.toLowerCase());
      if(!usedMeanings.has(meaning)){usedMeanings.add(meaning);}
      out.push({word:w,part_of_speech:"speaking starter",meaning,example:s.trim().slice(0,170)});
    }
  };
  fillFrom(ss); fillFrom(fullSentences);
  return out;
}
function shadows(text,level){
  const max={A1:10,A2:13,B1:18,B2:20,C1:22,C2:24}[level]??16;
  let out=sentences(text).filter(s=>{const n=s.split(/\s+/).length;return n>=3&&n<=max;});
  if(out.length<4){ // loosen: allow any sentence, split long ones by comma
    out=sentences(text).filter(s=>s.split(/\s+/).length>=3);
    if(out.length<4){
      out=[];
      for(const s of sentences(text)){ for(const part of s.split(/[;,] - |; |, /)){const p=part.trim();if(p.split(/\s+/).length>=3)out.push(p);}}
    }
  }
  return out.slice(0,6);
}
const FRAMES={A1:["I see…","It is…","I like…","I feel…"],A2:["This is about…","It happens because…","For me…","I would…"],
 B1:["The main idea is…","I'd say this because…","In my situation…","With a client, I would…"],
 B2:["What stands out is…","The speaker argues that…","Compared to me…","In practice I'd…"],
 C1:["The implicit point is…","On one hand…","That assumes…","I'd frame it as…"],
 C2:["The nuance here is…","While it's true that…","The underlying trade-off…","I'd qualify that by…"]};
const WRITE={A1:"Write 3 short sentences about the scene.",A2:"Write 4–5 sentences retelling what happened.",
 B1:"Write 5–6 short sentences: what happened and what you'd do.",B2:"Write a short paragraph: summary, reaction, and one comparison.",
 C1:"Write a structured paragraph with the point, evidence, and your view.",C2:"Write a nuanced 6–8 sentence interpretation and one counterpoint."};
const THINK={A1:["Finish: The speaker is…","Finish: I see…","Say one thing you like."],
 A2:["Finish: This happens because…","Change one detail: If I were there…","Say it about your own week."],
 B1:["Finish: The main point is…","Personalize: In my work I…","Give your opinion in one sentence."],
 B2:["Summarize the argument.","Agree or disagree with a reason.","Connect it to your own experience."],
 C1:["What does the speaker assume?","What evidence supports the claim?","What would you challenge?"] ,
 C2:["Name the implicit trade-off.","Offer a counterargument.","Reframe the idea for a client."]};

const fallback={};
for(const [level,videos] of Object.entries(manifest)){
  for(const v of videos){
    const srcKeys=SOURCES[v.id]??[];
    for(let seg=0;seg<v.parts;seg++){
      const src=scenes[srcKeys[seg]??srcKeys[0]];
      if(!src)continue;
      const all=sentences(src.transcript);
      const target=WORD_TARGET[level];
      // Walk forward in sentence-sized windows from seg*offset until the
      // passage reaches the level word target (capped by available text).
      const step=Math.max(1,Math.floor(all.length/ (v.parts*2) ));
      let start=Math.min(all.length-1,seg*step);
      let windowed=[];let words=0;
      for(let i=start;i<all.length&&words<target;i++){windowed.push(all[i]);words=windowed.join(" ").split(/\s+/).length;}
      if(windowed.join(" ").split(/\s+/).length<target*0.6){windowed=all.slice(0);}
      const passage=windowed.join(" ");
      const isWork=/client|design|price|meeting|business|feedback|brand|presentation/i.test(passage);
      const chunks=chunksFor(passage,level,isWork,src.transcript);
      fallback[`${level}|${v.id}|${seg}`]={
        title:src.title,author:src.author,start:0,passage,
        chunks,shadows:shadows(passage,level),
        questions: levelFallbackQuestions(level,isWork),
        frames:FRAMES[level],writingPrompt:WRITE[level],thinkPrompts:THINK[level],
        wordCount:passage.split(/\s+/).length,
      };
    }
  }
}
function levelFallbackQuestions(level,isWork){
 if(level==="A1")return ["Who is talking?","What do they do?","Which one phrase would you say?","Say one short sentence about it."];
 if(level==="A2")return ["What happens in this scene?","How does the speaker feel?","Which phrase is useful for you?","Retell it in simple sentences."];
 if(level==="B1")return [isWork?"What is the speaker trying to explain to the client?":"What is the speaker's main point?",isWork?"How would you explain the same thing to a client?":"How does this connect to your life?","What would the client or listener ask next?","Retell it and give your opinion."];
 if(level==="B2")return ["What argument is being made?","What evidence or example supports it?","Where do you agree or disagree?","Explain it clearly to a client."];
 if(level==="C1")return ["What is assumed but not stated?","How effective is the reasoning?","What would weaken the argument?","Give a one-minute critical response."];
 return ["What is the core trade-off?","How would you qualify the conclusion?","Present both sides in one minute.","Advise a client using this idea."];
}
writeFileSync("src/data/lesson-fallback.json",JSON.stringify(fallback,null,1));
const thin=Object.entries(fallback).filter(([k,v])=>v.chunks.length<4||v.shadows.length<3);
console.log("wrote",Object.keys(fallback).length,"level scenes; thin:",thin.map(x=>x[0]));
