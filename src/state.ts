import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const STATE_PATH = join(process.cwd(), "state.json");

export interface MonitorState {
  alerted: string[];
  consecutiveErrors: number;
  lastRun: string | null;
}

const DEFAULT_STATE: MonitorState = {
  alerted: [],
  consecutiveErrors: 0,
  lastRun: null,
};

export function loadState(): MonitorState {
  if (!existsSync(STATE_PATH)) return { ...DEFAULT_STATE, alerted: [] };
  try {
    const raw = readFileSync(STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      alerted: Array.isArray(parsed.alerted) ? parsed.alerted : [],
      consecutiveErrors:
        typeof parsed.consecutiveErrors === "number"
          ? parsed.consecutiveErrors
          : 0,
      lastRun: parsed.lastRun ?? null,
    };
  } catch {
    return { ...DEFAULT_STATE, alerted: [] };
  }
}

export function saveState(state: MonitorState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}
