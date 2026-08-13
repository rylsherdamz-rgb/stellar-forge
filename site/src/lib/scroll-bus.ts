export type Beat = "landing" | "install" | "skills" | "build" | "validate" | "test" | "deploy" | "ready";

export const BEATS: { id: Beat; label: string; start: number; end: number }[] = [
  { id: "landing", label: "Overview", start: 0.0, end: 0.16 },
  { id: "install", label: "Install", start: 0.16, end: 0.30 },
  { id: "skills", label: "Skills", start: 0.30, end: 0.42 },
  { id: "build", label: "Build", start: 0.42, end: 0.55 },
  { id: "validate", label: "Validate", start: 0.55, end: 0.68 },
  { id: "test", label: "Test", start: 0.68, end: 0.8 },
  { id: "deploy", label: "Deploy", start: 0.8, end: 0.92 },
  { id: "ready", label: "Ready", start: 0.92, end: 1.0 },
];

export const METRICS = {
  stars: "15",
  downloads: "82",
  version: "0.2.0",
};

export const INSTALL_CMD = "npm install -g create-stellar-agentic";
export const SKILL_CMD = "npx skills add rylsherdamz-rgb/stellar-forge";
export const GITHUB_URL = "https://github.com/rylsherdamz-rgb/stellar-forge";
export const NPM_URL = "https://www.npmjs.com/package/create-stellar-agentic";

export const scrollBus = {
  progress: 0,
  beat: "landing" as Beat,
  sub: 0,
  beatSeq: 0,
  keys: 0,
};

export const pointerBus = { x: 0, y: 0, active: false };

export const eventBus = {
  go: null as Beat | null,
  seq: 0,
};

export const camBus = {
  z: 6.3,
  x: 0,
  y: 2.9,
  lookY: 0.45,
  ry: -0.28,
  lid: 0,
  glow: 0.25,
  keys: 0,
};

export const overlayBus = {
  rect: { l: 0, t: 0, w: 0, h: 0, sx: 1, sy: 1, visible: false },
  obj: null as { matrixWorld: unknown } | null,
};

export type CamTarget = { z: number; x: number; y: number; lookY: number; ry: number; lid: number; glow: number };

export const CAM_TARGETS: Record<Beat, CamTarget> = {
  landing: { z: 6.3, x: 0, y: 2.9, lookY: 0.45, ry: -0.3, lid: 0, glow: 0.3 },
  install: { z: 5.6, x: 0, y: 3.0, lookY: 0.35, ry: -0.1, lid: 0.02, glow: 0.55 },
  skills: { z: 5.7, x: -0.35, y: 2.95, lookY: 0.4, ry: 0.18, lid: -0.02, glow: 0.4 },
  build: { z: 5.4, x: 0.22, y: 3.0, lookY: 0.35, ry: 0.05, lid: -0.03, glow: 0.5 },
  validate: { z: 5.3, x: -0.15, y: 3.1, lookY: 0.3, ry: -0.08, lid: -0.05, glow: 0.7 },
  test: { z: 5.5, x: 0.1, y: 2.95, lookY: 0.4, ry: 0.0, lid: 0.0, glow: 0.45 },
  deploy: { z: 5.4, x: 0, y: 3.05, lookY: 0.35, ry: 0.0, lid: 0.01, glow: 1.0 },
  ready: { z: 6.2, x: 0, y: 2.9, lookY: 0.45, ry: -0.22, lid: 0.0, glow: 0.35 },
};

export const KEY_SETS: Record<Beat, string[]> = {
  landing: [],
  install: ["enter", "i"],
  skills: ["s"],
  build: ["a", "s", "d", "f", "j", "k"],
  validate: ["v"],
  test: ["t"],
  deploy: ["d", "enter"],
  ready: [],
};

export function beatAt(p: number): { beat: Beat; sub: number } {
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    if (p >= b.start && p < b.end) {
      return { beat: b.id, sub: (p - b.start) / (b.end - b.start) };
    }
  }
  return { beat: "ready", sub: 1 };
}

export function beatScrollY(target: Beat): number {
  const b = BEATS.find((x) => x.id === target)!;
  return (b.start + b.end) / 2;
}

export function camTargetAt(p: number): CamTarget {
  const a = beatAt(p);
  const i = BEATS.findIndex((b) => b.id === a.beat);
  const cur = CAM_TARGETS[a.beat];
  const next = CAM_TARGETS[BEATS[Math.min(i + 1, BEATS.length - 1)].id];
  const t = a.sub;
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    z: lerp(cur.z, next.z),
    x: lerp(cur.x, next.x),
    y: lerp(cur.y, next.y),
    lookY: lerp(cur.lookY, next.lookY),
    ry: lerp(cur.ry, next.ry),
    lid: lerp(cur.lid, next.lid),
    glow: lerp(cur.glow, next.glow),
  };
}