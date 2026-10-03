"use client";

import type { ProgressEntry } from "@/lib/accents";

// Progress is keyed by a STABLE identity (course + video + scene index),
// never by the unit's ordinal position, which can shift when scenes are
// re-ordered. We persist to both localStorage (fast) and IndexedDB
// (durable across cache clears on some mobile browsers).

const LS_KEY = "rts-progress-v2";
const IDB_NAME = "read-to-speak";
const IDB_STORE = "kv";
const IDB_KEY = "progress-v2";

const empty = (): ProgressEntry => ({
  listens: 0,
  readingUnlocked: false,
  wordMarks: {},
  speakingDone: false,
  completed: false,
});

function idbOpen(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbWrite(value: string) {
  const db = await idbOpen();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, IDB_KEY);
  } catch {
    /* ignore */
  }
}

async function idbRead(): Promise<Record<string, ProgressEntry> | null> {
  const db = await idbOpen();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(typeof req.result === "string" ? JSON.parse(req.result) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function normalize(raw: unknown): Record<string, ProgressEntry> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, ProgressEntry> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const v = value as Partial<ProgressEntry>;
    if (!v || typeof v !== "object") continue;
    out[key] = {
      listens: Math.max(0, Number(v.listens) || 0),
      readingUnlocked: !!v.readingUnlocked,
      wordMarks: (v.wordMarks && typeof v.wordMarks === "object" ? v.wordMarks : {}) as Record<string, number>,
      speakingDone: !!v.speakingDone,
      completed: !!v.completed,
    };
  }
  return out;
}

// Stable key: course + YouTube video + scene index. Survives reordering.
export function stableLessonKey(courseLevel: string | undefined, videoId: string, seg: number) {
  return `${(courseLevel ?? "x").toLowerCase()}|${videoId}|${seg}`;
}

export function loadProgressSync(): Record<string, ProgressEntry> {
  if (typeof window === "undefined") return {};
  try {
    return normalize(JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"));
  } catch {
    return {};
  }
}

export async function loadProgress(): Promise<Record<string, ProgressEntry>> {
  if (typeof window === "undefined") return {};
  const local = loadProgressSync();
  const idb = await idbRead().catch(() => null);
  if (!idb) return local;
  // Merge: keep the more complete value for each key.
  const keys = new Set([...Object.keys(local), ...Object.keys(normalize(idb))]);
  const merged: Record<string, ProgressEntry> = {};
  for (const k of keys) {
    const a = local[k];
    const b = normalize(idb)[k];
    if (!a) merged[k] = b;
    else if (!b) merged[k] = a;
    else {
      merged[k] = {
        listens: Math.max(a.listens, b.listens),
        readingUnlocked: a.readingUnlocked || b.readingUnlocked,
        wordMarks: { ...(b.wordMarks ?? {}), ...(a.wordMarks ?? {}) },
        speakingDone: a.speakingDone || b.speakingDone,
        completed: a.completed || b.completed,
      };
    }
  }
  saveProgress(merged);
  return merged;
}

export function saveProgress(map: Record<string, ProgressEntry>) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(map);
  try { localStorage.setItem(LS_KEY, json); } catch { /* quota/private mode */ }
  void idbWrite(json);
}

export const emptyProgress = empty;
