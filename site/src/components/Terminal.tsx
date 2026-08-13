"use client";

import { useEffect, useRef, useState } from "react";

export type TermSeg = { text: string; cls?: "cp" | "ok" | "warn" | "dim" | "ccmd" };
export type TermLine = TermSeg[];

type Props = {
  lines: TermLine[];
  title?: string;
  className?: string;
  charRate?: number;
  startDelay?: number;
  idle?: React.ReactNode;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export default function Terminal({ lines, title = "stellar-forge — zsh", className = "", charRate = 18, startDelay = 300, idle }: Props) {
  const reduced = useReducedMotion();
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState<number[]>(() => lines.map(() => 0));
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setProgress(lines.map((l) => l.reduce((n, s) => n + s.text.length, 0)));
      setDone(true);
      return;
    }
    setProgress(lines.map(() => 0));
    setDone(false);
    const perLine = lines.map((l) => l.reduce((n, s) => n + s.text.length, 0));
    let lineIdx = 0;
    let charIdx = 0;
    let promptInstant = false;
    const timer = setTimeout(() => {
      const iv = setInterval(() => {
        if (lineIdx >= lines.length) {
          clearInterval(iv);
          setDone(true);
          return;
        }
        const line = lines[lineIdx];
        if (!promptInstant && line.length > 0 && line[0].text.startsWith("$")) {
          setProgress((p) => {
            const np = [...p];
            np[lineIdx] = line[0].text.length;
            return np;
          });
          promptInstant = true;
          return;
        }
        const total = perLine[lineIdx];
        setProgress((p) => {
          const np = [...p];
          np[lineIdx] = Math.min(np[lineIdx] + 1, total);
          return np;
        });
        charIdx++;
        if (charIdx >= total) {
          lineIdx++;
          charIdx = 0;
          promptInstant = false;
        }
      }, charRate);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [started, runId, reduced, lines, charRate, startDelay]);

  const totalChars = lines.reduce((n, l) => n + l.reduce((m, s) => m + s.text.length, 0), 0);
  const shownChars = progress.reduce((n, c) => n + c, 0);

  return (
    <div ref={rootRef} className={`term ${className}`}>
      <div className="tbar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="title">{title}</span>
        <button
          className="replay"
          onClick={() => setRunId((r) => r + 1)}
          aria-label="Replay terminal output"
          title="Replay"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
      </div>
      <div className="tbody" aria-live="polite">
        {lines.map((line, li) => {
          const shown = progress[li] ?? 0;
          let acc = 0;
          const segs: { s: TermSeg; start: number; end: number }[] = line.map((s) => {
            const start = acc;
            acc += s.text.length;
            return { s, start, end: acc };
          });
          const isActiveLine = started && !done && li === lines.length - 1 && shownChars < totalChars && shown < line.reduce((n, s) => n + s.text.length, 0);
          return (
            <div key={li} className="ln">
              {segs.map(({ s, start, end }, si) => {
                if (start >= shown) return null;
                const chars = Math.min(shown, end) - start;
                return (
                  <span key={si} className={s.cls ?? ""}>
                    {s.text.slice(0, chars)}
                  </span>
                );
              })}
              {isActiveLine && <span className="cursor" />}
            </div>
          );
        })}
        {done && idle}
      </div>
    </div>
  );
}