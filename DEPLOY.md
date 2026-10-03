# Deployment Guide — Read to Speak

A standard Next.js 16 (App Router) app. No database or API key is required to
run; `DATABASE_URL` is fully optional.

## Quick facts

| Item | Value |
| --- | --- |
| Framework | Next.js 16 (React 19, TypeScript), App Router |
| Package manager | npm (a `package-lock.json` is included) |
| Install | `npm install` |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Node version | Node 20+ |
| Output | `.next` (default Next.js server / standalone capable) |
| Required env vars | **none** |
| Optional env vars | `DATABASE_URL` (Postgres) |
| Database required | **No** — progress is saved in the browser (localStorage + IndexedDB) |

## Option 1 — Vercel (recommended, free)

1. Push this repository to GitHub.
2. Go to https://vercel.com/new and **Import** the repository.
3. Vercel auto-detects Next.js:
   - Framework: **Next.js**
   - Build command: `npm run build`
   - Output/Install: defaults (no override needed)
4. Environment Variables: leave empty (you do not need `DATABASE_URL`).
5. Click **Deploy**.

## Option 2 — Netlify

1. Push to GitHub.
2. Add the **Netlify Next.js runtime** (auto-suggested when you import the repo).
3. Build command `npm run build`, publish directory `.next` (the plugin sets this).
4. No environment variables required.

## Option 3 — Render / Railway / any Node host

1. Push to GitHub and create a **Web Service** from the repo.
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Expose the port Next prints (default `3000`).
5. No environment variables required.

## Optional Postgres backup (not needed for the app to work)

If you want server-side progress backup, create a Postgres database (Neon,
Supabase, Render, Railway…) and set:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Without it the app stores every learner's progress locally in their browser,
which is the default and works on every host.

## Notes

- All lesson content/data is committed under `src/data/` (JSON + TypeScript),
  so every lesson, route, and the MY CONTENT library work immediately.
- Audio is generated at runtime by `msedge-tts` (no external key). If the
  service is ever unreachable, the browser's built-in American English voice
  is used as a fallback.
- YouTube captions are fetched at request time; curated transcripts are
  bundled as a fallback so lessons open even when YouTube blocks a host.
- The files in `scripts/` are one-off content-generation helpers and are not
  needed at runtime. They are kept for transparency/future updates.
