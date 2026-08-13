"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LaptopScene from "@/components/LaptopScene";
import StaticLaptop from "@/components/StaticLaptop";
import InsideEnv from "@/components/InsideEnv";
import { diveBus, setDiveProgress, DIVE_ZOOM_END, DIVE_EXIT_START } from "@/lib/terminal-bus";

gsap.registerPlugin(ScrollTrigger);

const STATE_WINDOW_START = 0.34;
const STATE_WINDOW_LEN = 0.44;

export default function Immersion() {
  const sectionRef = useRef<HTMLElement>(null);
  const staticRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const insideRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"outside" | "inside" | "exit">("outside");
  const [state, setState] = useState(0);

  useEffect(() => {
    const section = sectionRef.current!;
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        setDiveProgress(p);
        setState(Math.max(0, Math.min(4, Math.floor((p - STATE_WINDOW_START) / (STATE_WINDOW_LEN / 5)))));
        setPhase(p < DIVE_ZOOM_END ? "outside" : p < DIVE_EXIT_START ? "inside" : "exit");
      },
    });
    return () => {
      st.kill();
      setDiveProgress(0);
      diveBus.inside = false;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const desktop = window.matchMedia("(min-width: 960px)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 1 },
      });
      if (desktop) {
        tl.to(sceneRef.current, { scale: 2.8, ease: "power3.in", duration: DIVE_ZOOM_END }, 0)
          .to(canvasRef.current, { autoAlpha: 0, duration: 0.06 }, 0.26)
          .to(canvasRef.current, { autoAlpha: 1, duration: 0.06 }, DIVE_EXIT_START)
          .to(sceneRef.current, { scale: 1, ease: "power2.out", duration: 0.14 }, DIVE_EXIT_START);
      } else {
        tl.to(staticRef.current, { scale: 6.2, ease: "power3.in", duration: DIVE_ZOOM_END }, 0)
          .to(staticRef.current, { autoAlpha: 0, duration: 0.06 }, 0.26);
      }
      tl.to(insideRef.current, { autoAlpha: 1, duration: 0.06 }, 0.3)
        .to(insideRef.current, { autoAlpha: 0, duration: 0.04 }, DIVE_EXIT_START);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="immersion" id="enter" ref={sectionRef} aria-label="Enter the StellarForge developer environment">
      <div className="immersion-sticky" data-phase={phase}>
        <div className="dive-canvas" ref={canvasRef}>
          <div className="dive-scene" ref={sceneRef}>
            <LaptopScene pinned />
          </div>
        </div>
        <div className="dive-static" ref={staticRef}>
          <StaticLaptop />
        </div>
        <div className="inside-wrap" ref={insideRef}>
          <InsideEnv state={state} />
        </div>
        {phase === "exit" && (
          <div className="dive-exit">
            <h2>Everything your agent needs to <span className="hl">build on Stellar.</span></h2>
            <div className="dive-exit-cards">
              <a className="dive-exit-card" href="#skill">
                <h4>StellarForge Skill</h4>
                <p>Teach your AI agent Stellar — six agent nodes, ten domain skills, five evals.</p>
                <span>Install Skill →</span>
              </a>
              <a className="dive-exit-card" href="#cli">
                <h4>StellarForge CLI</h4>
                <p>Run Stellar development workflows from your terminal.</p>
                <span>Install CLI →</span>
              </a>
            </div>
          </div>
        )}
        <div className={`dive-enter-hint ${phase === "outside" ? "in" : ""}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          Keep scrolling — the laptop opens
        </div>
      </div>
    </section>
  );
}