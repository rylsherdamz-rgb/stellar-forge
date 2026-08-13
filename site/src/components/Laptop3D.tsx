"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { camBus, pointerBus, scrollBus, overlayBus, camTargetAt, KEY_SETS } from "@/lib/scroll-bus";

const LID_OPEN = -0.26;
const SCREEN_W = 3.12;
const SCREEN_H = 1.95;
const SCREEN_Y = 1.475;
const SCREEN_Z = 0.04;
const LID_HALF = 1.225;

const CORNERS = [
  new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z),
  new THREE.Vector3(SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z),
  new THREE.Vector3(SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z),
  new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z),
];

const KEY_POS: Record<string, [number, number]> = {
  q: [1, 0], w: [2, 0], e: [3, 0], r: [4, 0], t: [5, 0], y: [6, 0], u: [7, 0], i: [8, 0], o: [9, 0], p: [10, 0],
  a: [1, 1], s: [2, 1], d: [3, 1], f: [4, 1], g: [5, 1], h: [6, 1], j: [7, 1], k: [8, 1], l: [9, 1],
  z: [1, 2], x: [2, 2], c: [3, 2], v: [4, 2], b: [5, 2], n: [6, 2], m: [7, 2],
  enter: [11, 1],
};

function drawKeyboard(ctx: CanvasRenderingContext2D, lit: Set<string>) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#14141b";
  ctx.fillRect(0, 0, W, H);
  const cols = 12;
  const rows = 3;
  const gap = 8;
  const kw = (W - gap * (cols + 1)) / cols;
  const kh = (H - gap * (rows + 2)) / (rows + 1);
  const drawKey = (c: number, r: number, wSpan: number, litKey: boolean) => {
    const x = gap + c * (kw + gap);
    const y = gap + r * (kh + gap);
    const ww = kw * wSpan + gap * (wSpan - 1);
    ctx.beginPath();
    ctx.roundRect(x, y, ww, kh, 3);
    if (litKey) {
      const g = ctx.createLinearGradient(0, y, 0, y + kh);
      g.addColorStop(0, "#3b2f6b");
      g.addColorStop(1, "#241d4a");
      ctx.fillStyle = g;
      ctx.shadowColor = "rgba(167,139,250,0.85)";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const g = ctx.createLinearGradient(0, y, 0, y + kh);
      g.addColorStop(0, "#1b1b23");
      g.addColorStop(1, "#101017");
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      drawKey(c, r, 1, lit.has(`${c},${r}`));
    }
  }
  drawKey(0, 3, 5, lit.has("space"));
  drawKey(6, 3, 5, lit.has("space2"));
  const sbY = gap + 3 * (kh + gap);
  const sbX = gap;
  const sbW = 5 * kw + 4 * gap;
  ctx.beginPath();
  ctx.roundRect(sbX + (kw + gap) * 6, sbY, sbW, kh, 3);
  const g = ctx.createLinearGradient(0, sbY, 0, sbY + kh);
  g.addColorStop(0, "#1b1b23");
  g.addColorStop(1, "#101017");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function litKeys(beat: string): Set<string> {
  const set = new Set<string>();
  for (const k of KEY_SETS[beat as keyof typeof KEY_SETS] ?? []) {
    const pos = KEY_POS[k];
    if (pos) set.add(`${pos[0]},${pos[1]}`);
    if (k === "enter") set.add("space");
  }
  return set;
}

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    ref.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return ref;
}

function Keyboard() {
  const meshRef = useRef<THREE.Mesh>(null);
  const seenKeys = useRef(0);
  const texRef = useRef<THREE.CanvasTexture | null>(null);

  const { texture, ctx } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 400;
    const ctx = c.getContext("2d")!;
    drawKeyboard(ctx, new Set());
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { texture: tex, ctx };
  }, []);
  texRef.current = texture;

  useFrame(() => {
    if (camBus.keys !== seenKeys.current) {
      seenKeys.current = camBus.keys;
      drawKeyboard(ctx, litKeys(scrollBus.beat));
      texture.needsUpdate = true;
    }
  });

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh ref={meshRef} position={[0, 0.012, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.5, 0.9775]} />
      <meshStandardMaterial map={texture} metalness={0.35} roughness={0.55} toneMapped={false} />
    </mesh>
  );
}

function ScreenGlass() {
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  const glowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 24, 128, 128, 128);
    grad.addColorStop(0, "rgba(167,139,250,0.5)");
    grad.addColorStop(1, "rgba(167,139,250,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => glowTex.dispose(), [glowTex]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const glow = camBus.glow;
    const breath = 0.85 + Math.sin(t * 2.1) * 0.15;
    const g = glow * breath;
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.1 + g * 0.3;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3.2 + g * 9 + (g > 0.85 ? Math.sin(t * 9) * 1.6 : 0);
    }
    if (rimRef.current) {
      rimRef.current.intensity = 2.2 + g * 3.4;
    }
  });

  return (
    <>
      <mesh position={[0, SCREEN_Y, 0.06]}>
        <planeGeometry args={[3.34, 2.06]} />
        <meshBasicMaterial map={glowTex} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, SCREEN_Y, 2.2]} intensity={3.2} distance={8} color="#a78bfa" />
      <pointLight ref={rimRef} position={[0, SCREEN_Y, -3.5]} intensity={2.2} distance={9} color="#7c5cff" />
    </>
  );
}

function Chassis() {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const screenPlaneRef = useRef<THREE.Mesh>(null);
  const glassRef = useRef<THREE.MeshStandardMaterial>(null);
  const bobRef = useRef(0);
  const reduced = useReducedMotion();
  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const tmpM = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    overlayBus.obj = screenPlaneRef.current;
    (window as unknown as Record<string, unknown>).__dbg = () => {
      const c = camTargetAt(scrollBus.progress);
      return {
        cam: stateDebugRef.current?.position?.toArray() ?? null,
        lid: lidRef.current?.rotation.x ?? null,
        target: c,
        prog: scrollBus.progress,
        w: (stateDebugRef.current as THREE.PerspectiveCamera | null)?.aspect ?? null,
      };
    };
    return () => {
      overlayBus.obj = null;
      delete (window as unknown as Record<string, unknown>).__dbg;
    };
  }, []);

  const stateDebugRef = useRef<THREE.Camera | null>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    stateDebugRef.current = state.camera;
    const target = camTargetAt(scrollBus.progress);
    const cam = state.camera;
    const k = reduced.current ? 1 : 1 - Math.exp(-3.4 * delta);
    const px = pointerBus.x * 0.5;
    const py = pointerBus.y * 0.24;

    cam.position.x += (target.x + px - cam.position.x) * k;
    cam.position.y += (target.y + py - cam.position.y) * k;
    cam.position.z += (target.z - cam.position.z) * k;
    tmpV.set(0, target.lookY + py * 0.35, 0);
    cam.lookAt(tmpV);

    const g = groupRef.current;
    if (g) {
      g.rotation.y += (target.ry + pointerBus.x * 0.06 - g.rotation.y) * k;
      bobRef.current += delta;
      const bob = reduced.current || target.glow > 0.6 ? 0 : Math.sin(bobRef.current * 0.9) * 0.035;
      g.position.y = -1.6 + bob;
      g.rotation.x = pointerBus.y * -0.02 * (reduced.current ? 0 : 1);
    }
    if (lidRef.current) {
      lidRef.current.rotation.x += (LID_OPEN + target.lid - lidRef.current.rotation.x) * k;
    }
    if (glassRef.current) {
      const m = glassRef.current as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.35 + target.glow * 0.9;
    }

    const obj = overlayBus.obj;
    if (obj) {
      tmpM.copy(obj.matrixWorld as THREE.Matrix4);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let behind = false;
      for (const c of CORNERS) {
        tmpV.copy(c).applyMatrix4(tmpM).project(cam);
        if (tmpV.z > 1) behind = true;
        const x = (tmpV.x * 0.5 + 0.5) * state.size.width;
        const y = (1 - (tmpV.y * 0.5 + 0.5)) * state.size.height;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const w = maxX - minX;
      const h = maxY - minY;
      const visible = !behind && w >= 260 && w <= state.size.width * 1.4;
      overlayBus.rect = {
        l: minX,
        t: minY,
        w,
        h,
        sx: w / 1600,
        sy: h / 1000,
        visible,
      };
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.6, 0]}>
      <group ref={lidRef} rotation={[LID_OPEN, 0, 0]}>
        <RoundedBox args={[3.6, 2.45, 0.055]} radius={0.028} position={[0, LID_HALF, 0]}>
          <meshStandardMaterial color="#1c1c24" metalness={0.78} roughness={0.38} />
        </RoundedBox>
        <mesh position={[0, 1.44, 0.03]}>
          <planeGeometry args={[3.26, 1.94]} />
          <meshStandardMaterial color="#050508" metalness={0.55} roughness={0.12} />
        </mesh>
        <mesh ref={screenPlaneRef} position={[0, SCREEN_Y, 0.038]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshStandardMaterial
            ref={glassRef}
            color="#060609"
            emissive="#14142a"
            emissiveIntensity={0.35}
            metalness={0.4}
            roughness={0.25}
          />
        </mesh>
        <ScreenGlass />
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.018, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 3.64, 24]} />
        <meshStandardMaterial color="#15151c" metalness={0.85} roughness={0.3} />
      </mesh>
      <RoundedBox args={[3.6, 0.09, 1.55]} radius={0.018} position={[0, -0.045, 0.775]}>
        <meshStandardMaterial color="#17171e" metalness={0.75} roughness={0.42} />
      </RoundedBox>
      <Keyboard />
      <RoundedBox args={[1.05, 0.028, 0.42]} radius={0.014} position={[0, 0.004, 1.32]}>
        <meshStandardMaterial color="#0f0f15" metalness={0.4} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[3.6, 0.026, 0.07]} radius={0.012} position={[0, -0.012, 1.5]}>
        <meshStandardMaterial color="#121219" metalness={0.8} roughness={0.35} />
      </RoundedBox>
    </group>
  );
}

function VoidBackdrop() {
  const glowRef = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "rgba(70,44,140,0.5)");
    grad.addColorStop(0.55, "rgba(40,26,80,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(() => {
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + camBus.glow * 0.4;
    }
  });

  return (
    <mesh ref={glowRef} position={[0, 0.1, -4.6]}>
      <planeGeometry args={[14, 6]} />
      <meshBasicMaterial map={tex} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function Shadow() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.72)");
    grad.addColorStop(0.7, "rgba(0,0,0,0.4)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.85, 0.2]}>
      <planeGeometry args={[9, 6]} />
      <meshBasicMaterial map={tex} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

export default function Laptop3D() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.9, 6.3], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.22} />
      <directionalLight position={[4, 6, 3]} intensity={0.55} color="#e8e8f2" />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} color="#6d4fd1" />
      <VoidBackdrop />
      <Chassis />
      <Shadow />
    </Canvas>
  );
}