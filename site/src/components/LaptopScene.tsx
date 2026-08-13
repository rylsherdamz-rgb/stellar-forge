"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { terminalBus, diveBus, diveIn, DIVE_ZOOM_END, DIVE_EXIT_START, type TerminalScript } from "@/lib/terminal-bus";

type Segment = { text: string; color: string; chip?: boolean };

const GRAPH_SCRIPT: Segment[] = [
  { text: "$ ", color: "#c4b5fd" },
  { text: "stellar-forge run ", color: "#e8e8ea" },
  { text: "\"payment contract\"", color: "#e8e8ea" },
  { text: "\n", color: "#e8e8ea" },
  { text: "graph engine → work graph built", color: "#9a9aa2" },
  { text: "\n", color: "#e8e8ea" },
  { text: "@stellar-contracts", color: "#c4b5fd", chip: true },
  { text: " → ", color: "#e8e8ea" },
  { text: "@stellar-frontend", color: "#c4b5fd", chip: true },
  { text: " → ", color: "#e8e8ea" },
  { text: "@stellar-backend", color: "#c4b5fd", chip: true },
  { text: "\n", color: "#e8e8ea" },
  { text: "✓ eval passed — deployed 2.1s", color: "#4ade80" },
];

const SKILL_SCRIPT: Segment[] = [
  { text: "$ ", color: "#c4b5fd" },
  { text: "npx skills add rylsherdamz-rgb/stellar-forge", color: "#e8e8ea" },
  { text: "\n", color: "#e8e8ea" },
  { text: "✓ 10 skills loaded on demand", color: "#4ade80" },
  { text: "\n", color: "#e8e8ea" },
  { text: "✓ 6 agents wired into the graph", color: "#4ade80" },
  { text: "\n", color: "#e8e8ea" },
  { text: "✓ evals armed — agent ready", color: "#4ade80" },
];

const CLI_SCRIPT: Segment[] = [
  { text: "$ ", color: "#c4b5fd" },
  { text: "npx create-stellar-agentic my-dapp --yes", color: "#e8e8ea" },
  { text: "\n", color: "#e8e8ea" },
  { text: "✔ contracts/token/src/lib.rs", color: "#9a9aa2" },
  { text: "\n", color: "#e8e8ea" },
  { text: "✔ frontend/src/app/page.tsx", color: "#9a9aa2" },
  { text: "\n", color: "#e8e8ea" },
  { text: "✔ All 10 skills installed", color: "#4ade80" },
];

const SCRIPTS: Record<TerminalScript, Segment[]> = {
  graph: GRAPH_SCRIPT,
  skill: SKILL_SCRIPT,
  cli: CLI_SCRIPT,
};

const CYCLE: TerminalScript[] = ["graph", "skill", "cli"];

function totalChars(script: Segment[]) {
  return script.reduce((n, s) => n + s.text.length, 0);
}

function drawTerminal(ctx: CanvasRenderingContext2D, mode: TerminalScript, chars: number, blink: boolean) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  ctx.fillStyle = "#0e0e12";
  ctx.fillRect(0, 0, W, 40);
  const dots = ["#ff5f57", "#febc2e", "#28c840"];
  dots.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(20 + i * 18, 20, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  ctx.fillStyle = "#6f6f78";
  ctx.font = "600 12px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("stellar-forge — agent session", W / 2, 26);
  ctx.textAlign = "left";

  const script = SCRIPTS[mode];
  let remaining = chars;
  let x = 24;
  let y = 40 + 32;
  ctx.font = "500 14px 'JetBrains Mono', ui-monospace, monospace";
  for (const seg of script) {
    const take = Math.min(remaining, seg.text.length);
    remaining -= take;
    if (take <= 0) break;
    const chunk = seg.text.slice(0, take);
    const w = ctx.measureText(chunk).width;
    if (seg.chip) {
      ctx.fillStyle = "rgba(167,139,250,0.14)";
      ctx.beginPath();
      ctx.roundRect(x - 6, y - 13, w + 12, 20, 6);
      ctx.fill();
    }
    ctx.fillStyle = seg.color;
    if (chunk.includes("\n")) {
      const [before, after] = chunk.split("\n");
      if (before) {
        ctx.fillText(before, x, y);
        x += ctx.measureText(before).width;
      }
      x = 24;
      y += 24;
      if (after) {
        ctx.fillText(after, x, y);
        x += ctx.measureText(after).width;
      }
    } else {
      ctx.fillText(chunk, x, y);
      x += w;
    }
  }
  if (blink) {
    ctx.fillStyle = "#c4b5fd";
    ctx.fillRect(x, y - 15, 9, 18);
  }
}

function drawKeyboard(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#141419";
  ctx.fillRect(0, 0, W, H);
  const cols = 12;
  const rows = 4;
  const gap = 6;
  const kw = (W - gap * (cols + 1)) / cols;
  const kh = (H - gap * (rows + 1)) / rows;
  ctx.fillStyle = "#0c0c10";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gap + c * (kw + gap);
      const y = gap + r * (kh + gap);
      ctx.beginPath();
      ctx.roundRect(x, y, kw, kh, 2.5);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.roundRect(gap + (cols - 4) * (kw + gap), gap + rows * (kh + gap), 4 * kw + 3 * gap, kh, 3);
  ctx.fillStyle = "#0c0c10";
  ctx.fill();
}

const SCREEN_GLOW_TEXTURE = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, "rgba(167,139,250,0.5)");
  grad.addColorStop(1, "rgba(167,139,250,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

function Screen({ zoom = 0 }: { zoom?: number }) {
  const glowRef = useRef<THREE.Mesh>(null);
  const modeRef = useRef<TerminalScript>("graph");
  const seenSeq = useRef(0);
  const charsRef = useRef(0);
  const accRef = useRef(0);
  const holdRef = useRef(0);
  const blinkRef = useRef(0);
  const blinkOnRef = useRef(true);
  const screenLightRef = useRef<THREE.PointLight>(null);

  const { texture, ctx } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 640;
    const ctx = c.getContext("2d")!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    drawTerminal(ctx, "graph", 0, true);
    return { texture: tex, ctx };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const kbTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 320;
    const ctx = c.getContext("2d")!;
    drawKeyboard(ctx, 1024, 320);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((state, delta) => {
    let dirty = false;
    if (terminalBus.seq !== seenSeq.current && terminalBus.script) {
      seenSeq.current = terminalBus.seq;
      modeRef.current = terminalBus.script;
      charsRef.current = 0;
      accRef.current = 0;
      holdRef.current = 0;
      dirty = true;
    }

    const script = SCRIPTS[modeRef.current];
    const total = totalChars(script);
    accRef.current += delta;
    if (accRef.current > 0.055) {
      accRef.current = 0;
      if (charsRef.current < total) {
        charsRef.current++;
        dirty = true;
      }
    }
    blinkRef.current += delta;
    if (blinkRef.current > 0.45) {
      blinkRef.current = 0;
      blinkOnRef.current = !blinkOnRef.current;
      dirty = true;
    }
    if (charsRef.current >= total) {
      holdRef.current += delta;
      if (holdRef.current > 3.2) {
        holdRef.current = 0;
        const i = CYCLE.indexOf(modeRef.current);
        modeRef.current = CYCLE[(i + 1) % CYCLE.length];
        charsRef.current = 0;
        dirty = true;
      }
    }
    if (dirty) drawTerminal(ctx, modeRef.current, charsRef.current, blinkOnRef.current);

    const e = state.clock.elapsedTime;
    if (screenLightRef.current) {
      screenLightRef.current.intensity = 6 + Math.sin(e * 2.2) * 0.8 + zoom * 7;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.14 + Math.sin(e * 2.2) * 0.03 + zoom * 0.22;
    }
  });

  return (
    <group>
      <group position={[0, -1.1, 0.06]}>
        <RoundedBox args={[3.4, 2.14, 0.05]} radius={0.03} position={[0, 1.1, 0]}>
          <meshStandardMaterial color="#1d1d24" metalness={0.75} roughness={0.35} />
        </RoundedBox>
        <group rotation={[0.24, 0, 0]} position={[0, 1.1, 0]}>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[3.12, 1.84]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.065]}>
            <planeGeometry args={[3.3, 2.0]} />
            <meshBasicMaterial
              map={SCREEN_GLOW_TEXTURE}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={glowRef} position={[0, 0, 0.075]}>
            <planeGeometry args={[3.4, 2.12]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.14} depthWrite={false} />
          </mesh>
        </group>
      </group>
      <RoundedBox args={[3.4, 0.1, 1.5]} radius={0.015} position={[0, -1.24, 0.34]}>
        <meshStandardMaterial color="#191920" metalness={0.7} roughness={0.42} />
      </RoundedBox>
      <mesh position={[0, -1.18, 0.37]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.12, 1.34]} />
        <meshBasicMaterial map={kbTex} toneMapped={false} />
      </mesh>
      <RoundedBox args={[0.9, 0.07, 0.52]} radius={0.02} position={[0, -1.19, -0.32]}>
        <meshStandardMaterial color="#0c0c10" metalness={0.45} roughness={0.55} />
      </RoundedBox>
      <pointLight ref={screenLightRef} position={[0, 0.3, 1.6]} intensity={6} distance={7} color="#a78bfa" />
    </group>
  );
}

function CameraRig({ pinned = false }: { pinned?: boolean }) {
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  const lookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useFrame((state, delta) => {
    const { camera, pointer } = state;
    let tx = 0;
    let ty = 0.15;
    let tz = 8.4;
    let ly = -0.3;
    if (pinned) {
      const p = diveBus.progress;
      if (p < DIVE_ZOOM_END) {
        const t = p / DIVE_ZOOM_END;
        const e = t * t * t;
        tz = 8.4 - e * (8.4 - 1.45);
        ty = 0.15 - e * 0.15;
        ly = -0.3 + e * 0.38;
        tx = pointer.x * 0.55 * (1 - t);
      } else if (p < DIVE_EXIT_START) {
        tz = 1.45;
        ty = 0;
        ly = 0.08;
      } else {
        const t = (p - DIVE_EXIT_START) / (1 - DIVE_EXIT_START);
        const e = t * t * (3 - 2 * t);
        tz = 1.45 + e * (8.4 - 1.45);
        ty = e * 0.15;
        ly = 0.08 - e * 0.38;
        tx = pointer.x * 0.55 * t;
      }
    } else if (diveBus.active) {
      tz = 2.3;
      ty = 0.02;
      ly = 0.05;
    } else {
      tx = pointer.x * 0.55;
      ty = 0.15 + pointer.y * 0.3;
    }
    const k = reduced.current ? 1 : 1 - Math.exp(-3.5 * delta);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    lookAt.set(0, ly, 0);
    camera.lookAt(lookAt);
  });
  return null;
}

export default function LaptopScene({ pinned = false }: { pinned?: boolean }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [diving, setDiving] = useState(false);
  const [zoom, setZoom] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setDiving(diveBus.active);
      if (pinned) setZoom(Math.min(1, diveBus.progress / DIVE_ZOOM_END));
    }, 120);
    return () => clearInterval(iv);
  }, [pinned]);

  useEffect(() => {
    if (pinned) return;
    const el = sceneRef.current;
    if (!el) return;
    const fn = () => diveIn();
    el.addEventListener("click", fn);
    return () => el.removeEventListener("click", fn);
  }, [pinned]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px) and (prefers-reduced-motion: no-preference)");
    const check = () => {
      let webgl = false;
      try {
        const c = document.createElement("canvas");
        webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        webgl = false;
      }
      setEnabled(mq.matches && webgl);
    };
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  if (enabled === null || !enabled) return null;

  return (
    <div
      ref={sceneRef}
      className={`laptop-scene ${pinned ? "pinned" : ""}`}
      role={pinned ? undefined : "button"}
      tabIndex={pinned ? undefined : 0}
      aria-label={pinned ? undefined : "Zoom into the laptop screen"}
      onKeyDown={
        pinned
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                diveIn();
              }
            }
      }
    >
      <Canvas
        frameloop="always"
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.15, 8.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={1.5} color="#ececf4" />
        <directionalLight position={[-6, -3, -5]} intensity={0.9} color="#7c5cff" />
        <pointLight position={[0, 2.6, 3]} intensity={1.4} color="#a78bfa" />
        <Float
          speed={diving ? 0 : 1.1 * (1 - zoom) + 0.05}
          rotationIntensity={diving ? 0 : 0.14 * (1 - zoom)}
          floatIntensity={diving ? 0 : 0.7 * (1 - zoom)}
        >
          <Screen zoom={zoom} />
        </Float>
        <CameraRig pinned={pinned} />
      </Canvas>
    </div>
  );
}