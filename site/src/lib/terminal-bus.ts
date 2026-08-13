export type TerminalScript = "graph" | "skill" | "cli";

export const terminalBus = { seq: 0, script: null as TerminalScript | null };

export function runTerminal(script: TerminalScript) {
  terminalBus.script = script;
  terminalBus.seq++;
}

export const diveBus = { active: false, seq: 0, progress: 0, inside: false };

export const DIVE_ZOOM_END = 0.3;
export const DIVE_EXIT_START = 0.86;

export function diveIn() {
  diveBus.active = true;
  diveBus.seq++;
}

export function diveOut() {
  diveBus.active = false;
  diveBus.seq++;
}

export function setDiveProgress(p: number) {
  diveBus.progress = p;
  const inside = p >= DIVE_ZOOM_END && p < DIVE_EXIT_START;
  if (inside !== diveBus.inside) {
    diveBus.inside = inside;
    diveBus.seq++;
  }
}
