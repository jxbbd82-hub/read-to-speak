import { realLessons } from "./curriculum-real";
import type { RealLesson } from "./curriculum-real";
// MY 3-MONTH SPEAKING TRACK
// ---------------------------------------------------------------------------
// A progressive speaking curriculum built from REAL, clean, short YouTube
// clips. Every row points to a genuine video (real human speech / animation /
// clean film dialogue / professional speakers — no AI videos, no lifestyle
// vloggers, no inappropriate visuals).
//
// Long talks are never assigned whole: `start` / `end` pick a short 2–5 minute
// usable SCENE, so input stays short and speaking time stays high.
//
// Progression:
//   Month 1 — Everyday speaking & conversations (listen → describe → react)
//   Month 2 — Opinions, stories, explaining ideas & asking questions
//   Month 3 — Work, clients, design discussions, feedback & presentations
//
// `key` is a stable id that also maps to the bundled transcript in
// my-content-transcripts.json, so every scene works offline even if a host
// temporarily cannot reach YouTube captions.

export type Cat = "everyday" | "conversation" | "opinion" | "story" | "explain" | "questions" | "work" | "client" | "design" | "feedback" | "meeting" | "present";

export type CurriculumLesson = {
  key: string;        // unique, matches transcript JSON entry
  day: number;
  week: number;       // 1..12
  stage: string;      // week stage title
  videoId: string;
  start?: number;     // seconds — short clip window
  end?: number;
  title: string;
  speaker: string;
  tag: string;        // short category shown on the card
  category: Cat;
  benefit: string;    // one short line
  focus: string;      // 60-second speaking challenge
  accent: "emerald" | "apricot" | "ink";
};

// Verified real sources (oembed-checked). Reused only as DISTINCT timestamped
// scenes, each with its own transcript and its own speaking task.
const V = {
  cutts: "UNP03fDSj1U",      // Matt Cutts — Try something new for 30 days (male, ~3:27)
  sivers: "V74AxCqOTvg",    // Derek Sivers — How to start a movement (male, ~3:00)
  waldinger: "8KkKuTCFvzI", // Robert Waldinger — What makes a good life (male, ~12:40; short scenes)
  julian: "eIho2S0ZahI",    // Julian Treasure — Speak so people listen (male, ~9:58; scenes)
  kaufman: "5MgBikgcWnY",   // Josh Kaufman — first 20 hours (male, ~20m; short scene)
  sinek: "HjriwYrGL28",     // Simon Sinek — Start with WHY short edit (male)
  // Animation / clean film dialogue (male-led, no distracting visuals)
  toyRocket: "wogrp3GNUM8",// Toy Story — Buzz & Woody short scene
  despMoon: "m95JdpLzkQY", // Despicable Me — clean animated scene
  despPizza: "Onc0P6sFcsc",// Despicable Me — clean animated scene
  vector: "A05n32Bl0aY",   // Despicable Me — Vector intro, clean
  // Real design / client professionals (male speakers)
  willSketch: "zipw9sx9Hy4", // Will Paterson — real logo process
  futurPresent: "BSxg87CoOu4",// The Futur — present identity projects
  futurAMA: "pa4u8KwpO0k",  // The Futur — Chris Do AMA
  presentLogo: "aWISsONFxyU",// present logo & brand identity
};

type Raw = [
  videoId: string, start: number | null, end: number | null,
  title: string, speaker: string, tag: string, category: Cat,
  benefit: string, focus: string,
];

const weeks: { stage: string; items: Raw[] }[] = [
  // ---------------- MONTH 1 — everyday & conversations ----------------
  { stage: "Week 1 · Everyday moments",
    items: [
      [V.cutts, 0, 95, "Trying one small new thing", "Matt Cutts", "Everyday · Habits", "everyday",
        "Talk about a simple habit using short, natural sentences.",
        "Tell a friend one small thing you tried recently and how it felt."],
      [V.cutts, 96, 200, "Why 30 days is enough to start", "Matt Cutts", "Everyday · Habits", "everyday",
        "Use 'I started…' and 'after a while…' to describe change.",
        "Describe one habit you want to build over the next 30 days."],
      [V.toyRocket, 0, 75, "Two friends solve a problem", "Toy Story", "Animation · Friendship", "conversation",
        "Hear short, clear back-and-forth lines you can copy.",
        "You and a friend have a small problem. Suggest a plan together."],
      [V.despPizza, 0, 80, "A quick, simple conversation", "Despicable Me", "Animation · Daily talk", "conversation",
        "Practice easy reactions and short replies.",
        "React to a friend's idea using one positive and one worried sentence."],
      [V.waldinger, 0, 110, "What people care about most", "Robert Waldinger", "Everyday · People", "story",
        "Describe a relationship and why it matters to you.",
        "Tell a 45-second story about a person who makes your life better."],
    ]},
  { stage: "Week 2 · Small talk & routines",
    items: [
      [V.waldinger, 110, 230, "A simple lesson from a long study", "Robert Waldinger", "Conversation · Wellbeing", "conversation",
        "Open and close a friendly topic in simple English.",
        "Make 60 seconds of small talk about your weekend."],
      [V.cutts, 120, 210, "Small steps build confidence", "Matt Cutts", "Everyday · Confidence", "everyday",
        "Describe progress without needing perfect grammar.",
        "Explain one thing that got easier after you practiced it."],
      [V.vector, 0, 80, "Introducing yourself clearly", "Despicable Me", "Animation · Introductions", "conversation",
        "Introduce yourself and what you do in a few lines.",
        "Introduce yourself as a designer to someone new, in 45 seconds."],
      [V.despMoon, 0, 90, "Explaining a plan in simple words", "Despicable Me", "Animation · Plans", "explain",
        "Use 'first, then, finally' to explain a plan.",
        "Explain your plan for tomorrow morning in three short steps."],
      [V.toyRocket, 40, 120, "Encouraging someone", "Toy Story", "Animation · Supporting", "conversation",
        "Practise encouraging and reassuring phrases.",
        "A friend is nervous. Reassure them and encourage them to continue."],
    ]},
  { stage: "Week 3 · Describing things",
    items: [
      [V.kaufman, 0, 120, "How we learn a new skill", "Josh Kaufman", "Everyday · Learning", "explain",
        "Describe how a process works in plain words.",
        "Describe how you learned one design skill, step by step."],
      [V.despPizza, 60, 140, "Describing what you see", "Despicable Me", "Animation · Describing", "explain",
        "Use simple adjectives and positions to describe a scene.",
        "Describe your workspace so someone can picture it."],
      [V.sivers, 0, 70, "One person starts something", "Derek Sivers", "Story · Observation", "story",
        "Tell what happens first in a clear sequence.",
        "Narrate the first few seconds of a short video in your own words."],
      [V.sivers, 70, 160, "The first follower changes everything", "Derek Sivers", "Conversation · People", "story",
        "Explain cause and effect using 'because' and 'so'.",
        "Tell about a time someone else's example made you join in."],
      [V.toyRocket, 80, 160, "Describing objects around you", "Toy Story", "Animation · Description", "explain",
        "Name and describe everyday objects naturally.",
        "Describe three objects on your desk and what you use them for."],
    ]},
  { stage: "Week 4 · Reacting & responding naturally",
    items: [
      [V.julian, 60, 170, "How people react to your voice", "Julian Treasure", "Conversation · Speaking", "conversation",
        "Notice how tone changes a simple message.",
        "Say the same sentence kindly, then firmly, and explain the difference."],
      [V.despMoon, 70, 160, "Reacting to unexpected news", "Despicable Me", "Animation · Reactions", "conversation",
        "Use natural reactions: surprise, agreement, doubt.",
        "Respond to three pieces of unexpected news in one take."],
      [V.cutts, 0, 130, "Sticking to something difficult", "Matt Cutts", "Story · Persistence", "story",
        "Talk about difficulty and then the result.",
        "Tell about a habit that was hard at first but worth it."],
      [V.waldinger, 230, 350, "Simple advice for a good life", "Robert Waldinger", "Opinion · Life", "opinion",
        "Agree or disagree with one clear reason.",
        "Give your opinion: what truly makes a good life, and why?"],
      [V.vector, 70, 150, "A playful misunderstanding", "Despicable Me", "Animation · Clarifying", "questions",
        "Ask for repetition and clarification politely.",
        "You didn't understand an instruction. Ask two clarifying questions."],
    ]},

  // ---------------- MONTH 2 — opinions, stories, ideas, questions --------
  { stage: "Week 5 · Giving opinions",
    items: [
      [V.sinek, 0, 90, "Starting with why", "Simon Sinek", "Opinion · Ideas", "opinion",
        "State an opinion and give one reason.",
        "Explain why you chose design as your field, starting with your 'why'."],
      [V.julian, 200, 320, "Honesty and warmth in speech", "Julian Treasure", "Opinion · Communication", "opinion",
        "Soften an opinion while staying honest.",
        "Give a polite opinion about a design you don't personally like."],
      [V.waldinger, 350, 470, "What you would tell younger people", "Robert Waldinger", "Opinion · Advice", "opinion",
        "Give advice as 'If I were you, I'd…'.",
        "Give one piece of advice to a designer who is just starting."],
      [V.kaufman, 120, 260, "Breaking a big goal into pieces", "Josh Kaufman", "Explain · Method", "explain",
        "Explain a method using ordered steps.",
        "Explain how you would break a branding project into stages."],
      [V.sivers, 140, 200, "What leadership really means", "Derek Sivers", "Opinion · Leadership", "opinion",
        "Express a surprising opinion clearly.",
        "Give your view on what makes someone easy to follow in a team."],
    ]},
  { stage: "Week 6 · Telling short stories",
    items: [
      [V.cutts, 160, 210, "A tiny story about change", "Matt Cutts", "Story · Personal", "story",
        "Tell a short personal story with a beginning and end.",
        "Tell a true 60-second story about something you changed."],
      [V.toyRocket, 0, 90, "A problem with a clear ending", "Toy Story", "Story · Narrative", "story",
        "Use past tenses to retell what happened.",
        "Retell the short scene in your own words, then change the ending."],
      [V.sivers, 30, 130, "How a crowd is built", "Derek Sivers", "Story · Observation", "story",
        "Describe a sequence of events smoothly.",
        "Tell how one small action turned into something bigger in your life."],
      [V.waldinger, 60, 200, "Stories behind the research", "Robert Waldinger", "Story · People", "story",
        "Retell an idea using a human example.",
        "Tell a short family story that shows one of your values."],
      [V.despPizza, 20, 110, "A light, friendly moment", "Despicable Me", "Story · Everyday", "story",
        "Retell a light moment with natural timing.",
        "Tell a short, clean funny thing that happened to you at work."],
    ]},
  { stage: "Week 7 · Asking good questions",
    items: [
      [V.presentLogo, 60, 200, "Questions behind a brand", "Typefool", "Questions · Brief", "questions",
        "Ask open questions to understand a goal.",
        "Ask a new client five questions to understand their brand."],
      [V.vector, 90, 150, "When you didn't quite hear", "Despicable Me", "Questions · Clarifying", "questions",
        "Use 'do you mean…?' and 'could you repeat…?'.",
        "Role-play: politely clarify three confusing points on a call."],
      [V.futurAMA, 0, 140, "Answering a question directly", "Chris Do", "Questions · Work", "questions",
        "Answer a question with a short, clear point.",
        "Answer: 'Why should we hire you instead of another designer?'" ],
      [V.kaufman, 260, 380, "Questions that help you learn", "Josh Kaufman", "Questions · Learning", "questions",
        "Ask yourself process questions while you work.",
        "Write and say three questions you ask before starting a design."],
      [V.julian, 320, 430, "Listening before answering", "Julian Treasure", "Questions · Listening", "questions",
        "Pause and confirm before responding.",
        "Listen to an imagined concern, then paraphrase it back before answering."],
    ]},
  { stage: "Week 8 · Explaining ideas clearly",
    items: [
      [V.willSketch, 120, 260, "From sketch to idea", "Will Paterson", "Explain · Design", "explain",
        "Explain visual decisions in simple words.",
        "Walk a client from your sketch to the idea behind your logo."],
      [V.sinek, 60, 150, "Explaining your why", "Simon Sinek", "Explain · Purpose", "explain",
        "Lead with purpose before details.",
        "Explain the purpose of a brand you designed in two sentences."],
      [V.futurPresent, 120, 260, "Explaining one design choice", "The Futur", "Explain · Design", "explain",
        "Connect a design choice to the client's goal.",
        "Explain your choice of color and typography to a client."],
      [V.presentLogo, 200, 340, "Showing how the logo works", "Typefool", "Explain · Logo", "explain",
        "Describe how a logo works in different places.",
        "Explain where the client's logo will work and why."],
      [V.kaufman, 60, 180, "Making complex things simple", "Josh Kaufman", "Explain · Simplicity", "explain",
        "Simplify a complicated idea into short sentences.",
        "Explain what a brand identity is to someone who knows nothing about design."],
    ]},

  // ---------------- MONTH 3 — work, clients, design, meetings -----------
  { stage: "Week 9 · Talking about your work",
    items: [
      [V.willSketch, 0, 140, "Describing your design process", "Will Paterson", "Work · Process", "work",
        "Describe your professional process with confidence.",
        "Describe your design process to a potential client in 60 seconds."],
      [V.futurAMA, 140, 300, "How to talk about your value", "Chris Do", "Work · Value", "work",
        "Talk about value, not just tasks.",
        "Explain the value you bring beyond making something look nice."],
      [V.sinek, 0, 120, "Why your work matters", "Simon Sinek", "Work · Purpose", "work",
        "Connect your work to a bigger reason.",
        "Say why good branding matters for a small business."],
      [V.kaufman, 180, 320, "Managing your time on a project", "Josh Kaufman", "Work · Productivity", "work",
        "Talk about planning and realistic timing.",
        "Explain how you plan your week to hit a deadline."],
      [V.futurPresent, 0, 120, "Preparing to present", "The Futur", "Work · Preparation", "work",
        "Describe preparation before a client meeting.",
        "Describe how you prepare a design presentation the day before."],
    ]},
  { stage: "Week 10 · Client communication",
    items: [
      [V.futurAMA, 300, 440, "Responding to a client question", "Chris Do", "Client · Calls", "client",
        "Answer calmly and keep the call moving.",
        "A client asks 'How much will this cost?' Reply professionally for 45 seconds."],
      [V.presentLogo, 0, 120, "Opening a client presentation", "Typefool", "Client · Meetings", "client",
        "Open a meeting with a clear, calm frame.",
        "Open an imaginary client presentation in three sentences."],
      [V.willSketch, 260, 400, "Explaining revisions", "Will Paterson", "Client · Revisions", "client",
        "Talk about changes without sounding defensive.",
        "Tell a client how the revision round works, clearly and kindly."],
      [V.julian, 120, 240, "Sounding calm and clear on a call", "Julian Treasure", "Client · Voice", "client",
        "Use pace and pauses to sound confident.",
        "Deliver a calm 30-second update to a worried client."],
      [V.futurPresent, 300, 440, "Ending a conversation well", "The Futur", "Client · Closing", "client",
        "Summarize and set the next step.",
        "Close a client call by summarizing decisions and the next deadline."],
    ]},
  { stage: "Week 11 · Feedback, opinions & negotiation",
    items: [
      [V.futurPresent, 200, 320, "Guiding the client's feedback", "The Futur", "Feedback · Guiding", "feedback",
        "Move feedback from taste to goals.",
        "A client says 'I don't like it.' Ask three useful questions."],
      [V.willSketch, 400, 540, "Defending a design decision", "Will Paterson", "Feedback · Decisions", "feedback",
        "Justify a decision with a reason, not an opinion.",
        "Defend one design choice calmly using the client's own goals."],
      [V.futurAMA, 440, 580, "Talking about scope and price", "Chris Do", "Feedback · Negotiation", "meeting",
        "Set a boundary politely and offer options.",
        "A client adds extra work. Respond with a polite option and a price note."],
      [V.sinek, 90, 150, "Disagreeing with respect", "Simon Sinek", "Feedback · Disagreeing", "feedback",
        "Disagree while acknowledging the other person.",
        "Politely disagree with a client's suggestion, then offer a better option."],
      [V.presentLogo, 300, 420, "Choosing a direction together", "Typefool", "Feedback · Decisions", "feedback",
        "Recommend a direction and invite the client in.",
        "Recommend one logo direction and ask for the client's decision."],
    ]},
  { stage: "Week 12 · Presentations & natural meetings",
    items: [
      [V.futurPresent, 60, 200, "Presenting a concept end to end", "The Futur", "Presenting · Concepts", "present",
        "Introduce, explain, and close one concept.",
        "Present one brand concept for 60 seconds as if the client is watching."],
      [V.presentLogo, 120, 260, "Walking through the visuals", "Typefool", "Presenting · Walkthrough", "present",
        "Guide attention step by step.",
        "Walk a client through your slides: brief, concept, color, application."],
      [V.willSketch, 540, 680, "Telling the story of the brand", "Will Paterson", "Presenting · Story", "present",
        "Present design as a story, not a list.",
        "Tell the 60-second story behind a brand identity you created."],
      [V.futurAMA, 580, 700, "Handling a live question", "Chris Do", "Meetings · Q&A", "meeting",
        "Think on your feet with a calm structure.",
        "Answer a surprise client question in a meeting in under 45 seconds."],
      [V.julian, 430, 560, "Speaking so people listen", "Julian Treasure", "Presenting · Delivery", "present",
        "Use voice control to hold attention.",
        "Deliver your final 60-second client pitch with a slow, confident opening."],
    ]},
];

function accentFor(i: number): CurriculumLesson["accent"] {
  return (["emerald", "apricot", "ink"] as const)[i % 3];
}

function flat(): CurriculumLesson[] {
  const out: CurriculumLesson[] = [];
  let day = 0;
  weeks.forEach((w, wi) => {
    w.items.forEach((r, ii) => {
      day += 1;
      const [videoId, start, end, title, speaker, tag, category, benefit, focus] = r;
      const key = `mc-${String(day).padStart(2, "0")}`;
      out.push({
        key, day, week: wi + 1, stage: w.stage,
        videoId, start: start ?? undefined, end: end ?? undefined,
        title, speaker, tag, category, benefit, focus, accent: accentFor(day - 1),
      });
    });
  });
  return out;
}

const curriculumLessonsLegacy = flat();
const curriculumWeeksLegacy = weeks;
export const TOTAL_DAYS = realLessons.length;
export { V as curriculumVideos };



export type CurriculumReal = RealLesson;
export const realCurriculumLessons = realLessons.map((l) => ({
  ...l,
  id: l.key,
  number: l.day,
  level: "B1" as const,
  source: "video" as const,
  grammar: l.benefit,
  grammarNote: "",
  duration: null,
  passage: [],
  vocabulary: [],
  speakingPrompts: [],
  answerFrames: [],
  shadowLines: [],
  summary: l.focus,
  voice: "andrew" as const,
  seg: 0,
}));
// Public exports consumed by the app:
//   curriculumLessons  -> 60 real-caption lessons
//   curriculumWeeks    -> 12 progressive stage labels
export { realCurriculumLessons as curriculumLessons };
export const curriculumWeeks = Array.from({ length: 12 }, (_, i) => ({
  stage: realLessons.find((l) => l.week === i + 1)?.stage ?? `Week ${i + 1}`,
}));
export const REAL_LESSONS = realLessons;
