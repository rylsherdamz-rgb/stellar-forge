"use client";

import { useEffect, useRef, useState } from "react";
import ScreenApp from "@/components/screen/ScreenApp";
import { overlayBus, pointerBus, type Beat } from "@/lib/scroll-bus";

function usePointerParallax(depth: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = ref.current;
      if (!el) return;
      const x = pointerBus.x * depth;
      const y = pointerBus.y * depth;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [depth]);
  return ref;
}

function Sheen() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let cx = 50;
    let cy = 50;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = ref.current;
      if (!el) return;
      cx += (pointerBus.x * 30 + 50 - cx) * 0.05;
      cy += (pointerBus.y * 20 + 50 - cy) * 0.05;
      el.style.backgroundPosition = `${cx.toFixed(1)}% ${cy.toFixed(1)}%`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} className="glass-sheen" aria-hidden />;
}

function FakeCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const tx = pointerBus.x * 400;
      const ty = pointerBus.y * 250;
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      rx += (tx * 1.4 - rx) * 0.1;
      ry += (ty * 1.4 - ry) * 0.1;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <div ref={dot} className="fake-cursor dot" aria-hidden />
      <div ref={ring} className="fake-cursor ring" aria-hidden />
    </>
  );
}

function FloatingToast({ beat }: { beat: Beat }) {
  const ref = usePointerParallax(26);
  if (beat === "build") {
    return (
      <div ref={ref} className="floating-toast ok" role="status">
        <span className="ft-icon">✓</span>
        <span>
          <strong>eval passed</strong>
          <em>contract compiles · tests pass · 2.1s</em>
        </span>
      </div>
    );
  }
  if (beat === "deploy") {
    return (
      <div ref={ref} className="floating-toast glow" role="status">
        <span className="ft-icon">▲</span>
        <span>
          <strong>deployed to testnet</strong>
          <em>contract live · verified</em>
        </span>
      </div>
    );
  }
  return null;
}

export default function ScreenOverlay({ beat }: { beat: Beat }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const root = rootRef.current;
      const inner = innerRef.current;
      if (!root || !inner) return;
      const r = overlayBus.rect;
      if (!r.visible) {
        if (root.style.opacity !== "0") root.style.opacity = "0";
        return;
      }
      root.style.opacity = "1";
      const tx = `${r.l.toFixed(1)}px`;
      const ty = `${r.t.toFixed(1)}px`;
      const sx = r.sx.toFixed(5);
      const sy = r.sy.toFixed(5);
      if (inner.style.transform !== `translate(${tx}, ${ty}) scale(${sx}, ${sy})`) {
        inner.style.transform = `translate(${tx}, ${ty}) scale(${sx}, ${sy})`;
      }
      const vis = r.w >= 360;
      if (vis !== show) setShow(vis);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [show]);

  return (
    <div ref={rootRef} className="screen-overlay" style={{ opacity: 0 }} aria-hidden={!show}>
      <div ref={innerRef} className="screen-overlay-inner" style={{ transformOrigin: "0 0" }}>
        <div className="screen-glass-frame">
          <div className="screen-app" style={{ width: 1600, height: 1000 }}>
            <ScreenApp beat={beat} />
            <Sheen />
          </div>
          <FloatingToast beat={beat} />
          <FakeCursor />
        </div>
      </div>
    </div>
  );
}