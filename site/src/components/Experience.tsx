"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Laptop3D from "@/components/Laptop3D";
import ScreenOverlay from "@/components/ScreenOverlay";
import MobileLaptop from "@/components/MobileLaptop";
import { GITHUB_URL, METRICS, beatAt, beatScrollY, eventBus, pointerBus, scrollBus, type Beat } from "@/lib/scroll-bus";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const TRACK_VH = 800;

function Wordmark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3.5" fill="#8b5cf6" />
      <circle cx="3" cy="12" r="1.5" fill="#8b5cf6" opacity="0.55" />
      <circle cx="12" cy="3" r="1.5" fill="#8b5cf6" opacity="0.55" />
      <circle cx="21" cy="12" r="1.5" fill="#8b5cf6" opacity="0.55" />
      <circle cx="12" cy="21" r="1.5" fill="#8b5cf6" opacity="0.55" />
      <line x1="12" y1="3" x2="12" y2="8.5" stroke="#8b5cf6" strokeWidth="1" opacity="0.4" />
      <line x1="12" y1="15.5" x2="12" y2="21" stroke="#8b5cf6" strokeWidth="1" opacity="0.4" />
      <line x1="3" y1="12" x2="8.5" y2="12" stroke="#8b5cf6" strokeWidth="1" opacity="0.4" />
      <line x1="15.5" y1="12" x2="21" y2="12" stroke="#8b5cf6" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <a className="wordmark" href="/">
        <Wordmark /> Stellar <em>Forge</em>
      </a>
      <div className="topbar-links">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">★ {METRICS.stars} · GitHub</a>
        <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noreferrer">Documentation</a>
        <span className="topbar-ver">v{METRICS.version}</span>
      </div>
    </header>
  );
}

function ScrollCue({ gone }: { gone: boolean }) {
  return (
    <div className={`scroll-cue ${gone ? "gone" : ""}`} aria-hidden>
      <span>SCROLL — THE MACHINE RESPONDS</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    </div>
  );
}

function useDesktop3D() {
  const [mode, setMode] = useState<"boot" | "desktop" | "mobile">("boot");
  useEffect(() => {
    const check = () => {
      const mq = window.matchMedia("(min-width: 900px)");
      let webgl = false;
      try {
        const c = document.createElement("canvas");
        webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        webgl = false;
      }
      setMode(mq.matches && webgl ? "desktop" : "mobile");
    };
    check();
    const mq = window.matchMedia("(min-width: 900px)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  return mode;
}

export default function Experience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState<Beat>("landing");
  const [cueGone, setCueGone] = useState(false);
  const beatRef = useRef<Beat>("landing");
  const mode = useDesktop3D();
  const scrolledRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const st = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        scrollBus.progress = p;
        const { beat: b } = beatAt(p);
        if (b !== beatRef.current) {
          beatRef.current = b;
          scrollBus.beat = b;
          scrollBus.beatSeq++;
          scrollBus.keys++;
          setBeat(b);
        }
        if (p > 0.03 && !scrolledRef.current) {
          scrolledRef.current = true;
          setCueGone(true);
        }
      },
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const total = track.offsetHeight - window.innerHeight;
    const iv = window.setInterval(() => {
      if (!eventBus.seq) return;
      const go = eventBus.go;
      eventBus.seq = 0;
      if (!go) return;
      const y = Math.max(0, Math.min(total, beatScrollY(go) * total));
      gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 1.4, ease: "power2.inOut", overwrite: "auto" });
    }, 120);
    return () => window.clearInterval(iv);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerBus.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      pointerBus.y = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      pointerBus.active = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <TopBar />
      <main className="stage" id="experience">
        <div className="stage-vignette" aria-hidden />
        {mode === "desktop" && (
          <div className="canvas-wrap">
            <Laptop3D />
          </div>
        )}
        {mode === "desktop" && <ScreenOverlay beat={beat} />}
        {mode === "mobile" && (
          <div className="mobile-stage">
            <MobileLaptop beat={beat} />
          </div>
        )}
        {mode === "boot" && <div className="boot-sheen" aria-hidden />}
        <ScrollCue gone={cueGone} />
      </main>
      <div ref={trackRef} className="track" aria-hidden />
      <footer className="site-footer">
        <div className="footer-inner">
          <span>MIT License · v0.3.0</span>
          <div className="footer-links">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.npmjs.com/package/create-stellar-agentic" target="_blank" rel="noreferrer">npm</a>
            <a href="https://stellar.org" target="_blank" rel="noreferrer">Stellar</a>
          </div>
        </div>
      </footer>
    </>
  );
}