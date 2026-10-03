# Read to Speak

A dark, premium English-speaking practice app built around **real YouTube clips**
that turn into complete speaking lessons. It is aimed at learners who
*understand* English at roughly B1 but *speak* closer to A2 — especially a
graphic / branding designer who wants to talk naturally with foreign clients.

Every lesson runs the same speaking-first flow:

**WATCH → LISTEN → SHADOW → STEAL THESE PHRASES → THINK IN ENGLISH →
SPEAK OUT LOUD → 🎤 SPEAKING CHALLENGE → WRITE**

## What's inside

- **Six CEFR paths (A1 → C2)** — 72 curated short scenes from shows, games,
  interviews, and real conversations. Each level uses its own videos (no
  cross-level repetition).
- **MY CONTENT — a 90-day speaking path** of 90 short lessons across
  everyday English, work/freelancing, design/creative work, and client
  communication. The home screen shows **Today**, then **Next**, with the full
  set behind a Library.
- **Real-video lab** — paste any public YouTube link and it becomes the same
  full lesson; also includes a **YouGlish-powered phrase search** that flips
  through real videos of a word/sentence.
- **Think in English** — a daily 5-minute micro-thought trainer to stop
  translating from your first language.
- **General American audio** for every sentence and phrase (one consistent
  male neural voice), while each YouTube clip keeps its original speaker.
- **Phrase playback, shadowing, voice recorder, writing + dictation**, and
  progress tracking (days completed, phrases used).

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4**
- YouTube embeds + server-side caption extraction
- `msedge-tts` (neural American TTS, no API key)
- Progress stored in the browser (`localStorage` + `IndexedDB`)
- **Optional** Postgres via Drizzle ORM for an extra server-side progress copy

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Build & run for production

```bash
npm install
npm run build
npm run start
```

## Environment variables

**None are required.** The app runs fully with browser-side storage.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | optional | Postgres connection string. When set, progress is also backed up server-side. When unset, the app silently uses browser storage. |

A working example is provided in `.env.example`.

## Database required?

**No.** The product is functional without any backend or database: lessons,
routing, YouTube embeds, audio, and progress all work. Postgres is only an
optional, best-effort backup of learner progress.

## Deployment

The app deploys unchanged to Vercel, Netlify, Render, Railway, or any
Node/Next.js host. See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions.
