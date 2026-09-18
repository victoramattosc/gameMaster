import { Campaign } from "./types";

const STORAGE_KEY = "gm_dashboard_v2";

export interface PersistedState {
  campaigns: Campaign[];
  activeId: string | null;
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.campaigns) || !parsed.campaigns.length) {
      return null;
    }
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — state stays in-memory only.
  }
}
