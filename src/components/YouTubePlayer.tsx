"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type YouTubePlayerHandle = {
  seekTo: (seconds: number, autoplay?: boolean) => void;
  playSegment: (start: number, end: number) => void;
  isReady: boolean;
};

type Props = {
  videoId: string;
  start?: number;
  onTime?: (seconds: number) => void;
  onReady?: () => void;
};

// Minimal typing for the YT IFrame API we use.
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
    __rtsYtReady?: Promise<void>;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (apiPromise) return apiPromise;
  if (window.YT?.Player) return Promise.resolve();
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

/**
 * YouTube IFrame player. Exposes precise seek/segment controls and emits
 * time updates so a transcript can stay synchronized sentence by sentence.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayer(
  { videoId, start = 0, onTime, onReady },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const endAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    isReady: ready,
    seekTo(seconds, autoplay = true) {
      endAtRef.current = null;
      const p = playerRef.current;
      if (!p) return;
      try {
        p.seekTo(seconds, true);
        if (autoplay) p.playVideo();
      } catch { /* not ready */ }
    },
    playSegment(startS, endS) {
      const p = playerRef.current;
      if (!p) return;
      try {
        endAtRef.current = endS;
        p.seekTo(startS, true);
        p.playVideo();
      } catch { /* not ready */ }
    },
  }), [ready]);

  useEffect(() => {
    let cancelled = false;
    // Continuously report playback time and enforce sentence end-boundaries.
    const tick = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const loop = () => {
        const p = playerRef.current;
        if (p && typeof p.getCurrentTime === "function") {
          const t = p.getCurrentTime();
          onTime?.(t);
          // Stop at a sentence boundary for repeat/segment playback.
          if (endAtRef.current != null && t >= endAtRef.current - 0.05) {
            p.pauseVideo();
            endAtRef.current = null;
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          start: Math.max(0, Math.floor(start)),
          rel: 0,
          cc_load_policy: 1,
          hl: "en",
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setReady(true);
            onReady?.();
            tick();
          },
          onStateChange: (e: any) => {
            if (e?.data === 1 /* playing */) tick();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { playerRef.current?.destroy?.(); } catch { /* noop */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", backgroundColor: "#000" }}>
      <div className="relative aspect-video w-full">
        <div ref={hostRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
});

export default YouTubePlayer;
