"use client";

import { useRef, useState } from "react";

type Props = {
  label?: string;
  accentColor?: string;
  onStopped?: () => void;
  compact?: boolean;
};

/** Minimal, reliable recorder: Start → Speak → Stop → Replay / Try again. */
export default function SimpleRecorder({ label = "🎙 Start", accentColor = "var(--accent-solid)", onStopped, compact }: Props) {
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [url, setUrl] = useState("");

  const start = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!s) return;
    stream.current = s; chunks.current = []; setUrl("");
    const r = new MediaRecorder(s); rec.current = r;
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      setUrl(URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType || "audio/webm" })));
      s.getTracks().forEach((t) => t.stop());
      setState("done"); onStopped?.();
    };
    r.start(); setState("recording");
  };
  const stop = () => rec.current?.state === "recording" && rec.current.stop();
  const again = () => { setUrl(""); setState("idle"); };

  if (state === "idle")
    return <button type="button" onClick={start} className="rounded-full px-4 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: accentColor }}>{label}</button>;

  if (state === "recording")
    return (
      <div className="flex items-center gap-3">
        <button type="button" onClick={stop} className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: "#b0473f" }}>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" /> Stop
        </button>
        <span className="text-[12px]" style={{ color: "var(--muted)" }}>Speaking…</span>
      </div>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && url && <audio src={url} controls className="h-10 min-w-0 max-w-[220px] flex-1" />}
      {compact && url && <a href={url} className="text-[12px] font-semibold underline" style={{ color: accentColor }}>Replay ↗</a>}
      <button type="button" onClick={start} className="rounded-full border px-3 py-2 text-[12px] font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>↻ Try again</button>
    </div>
  );
}
