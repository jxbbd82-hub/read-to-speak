import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const COOKIE = "rts_uid";
const MAX_MARKS = 5;

function getUid(req: NextRequest): string {
  return req.cookies.get(COOKIE)?.value ?? crypto.randomUUID();
}

function setUid(res: NextResponse, uid: string) {
  res.cookies.set(COOKIE, uid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// GET /api/progress -> all progress rows for this learner as a map keyed by `key`
export async function GET(req: NextRequest) {
  const uid = getUid(req);
  // Without a configured database the client stores progress in localStorage.
  if (!db) return NextResponse.json({ uid, progress: {} });
  try {
    const rows = await db.select().from(progress).where(eq(progress.userId, uid));
    const map: Record<string, (typeof rows)[number]> = {};
    for (const r of rows) map[r.key] = r;
    const res = NextResponse.json({ uid, progress: map });
    if (!req.cookies.get(COOKIE)) setUid(res, uid);
    return res;
  } catch {
    return NextResponse.json({ uid, progress: {} });
  }
}

// POST /api/progress -> upsert a single item's progress
type Body = {
  key: string;
  listens?: number;
  readingUnlocked?: boolean;
  wordMarks?: Record<string, number>;
  speakingDone?: boolean;
  completed?: boolean;
};

export async function POST(req: NextRequest) {
  const uid = getUid(req);
  const body = (await req.json()) as Body;
  if (!body.key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }
  if (!db) return NextResponse.json({ ok: true, stored: "browser" });

  // Database is an optional backup. It must never break the learner's save,
  // which is also stored locally (localStorage + IndexedDB).
  try {
    const existing = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, uid), eq(progress.key, body.key)))
      .limit(1);

    const prev = existing[0];
    const prevMarks = (prev?.wordMarks ?? {}) as Record<string, number>;

    // Merge word marks: take the max per word (don't let a client lower a count).
    const mergedMarks: Record<string, number> = { ...prevMarks };
    if (body.wordMarks) {
      for (const [w, v] of Object.entries(body.wordMarks)) {
        const clean = Math.max(0, Math.min(MAX_MARKS, Math.round(v ?? 0)));
        mergedMarks[w] = Math.max(mergedMarks[w] ?? 0, clean);
      }
    }

    const listens = Math.max(prev?.listens ?? 0, body.listens ?? 0);
    const readingUnlocked = body.readingUnlocked ?? prev?.readingUnlocked ?? false;
    const speakingDone = body.speakingDone ?? prev?.speakingDone ?? false;
    const completed = body.completed ?? prev?.completed ?? false;

    if (!prev) {
      await db.insert(progress).values({
        userId: uid,
        key: body.key,
        listens,
        readingUnlocked,
        wordMarks: mergedMarks,
        speakingDone,
        completed,
      });
    } else {
      await db
        .update(progress)
        .set({
          listens,
          readingUnlocked,
          wordMarks: mergedMarks,
          speakingDone,
          completed,
          updatedAt: new Date(),
        })
        .where(and(eq(progress.userId, uid), eq(progress.key, body.key)));
    }
  } catch {
    // Local copy is the source of truth; ignore any database failure.
  }

  const res = NextResponse.json({ ok: true });
  if (!req.cookies.get(COOKIE)) setUid(res, uid);
  return res;
}
