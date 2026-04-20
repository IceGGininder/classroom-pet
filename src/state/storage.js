// src/state/storage.js
// localStorage 封裝，提供 load / save / reset，注入預設 schema。

export const STORAGE_KEY = 'classroom-pet-state-v1';

function defaultState() {
  return {
    version: '1.0',
    pet: {
      name: '小精靈',
      stage: 'egg',
      totalExp: 0,
      currentMood: 60,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
    skills: {
      unlocked: [],
    },
    settings: {
      stageThresholds: [0, 300, 800, 1800, 3500, 6000],
      thresholdPreset: 'standard',
      modes: {
        focus:   { offsets: [3, 6, 10], adjustment: 0 },
        discuss: { offsets: [8, 12, 18], adjustment: 0 },
        free:    { offsets: [15, 22, 30], adjustment: 0 },
      },
      calibration: {
        baselineDb: null,
        calibratedAt: null,
      },
      soundEnabled: true,
      notificationsEnabled: true,
      currentMode: 'focus',
      isPaused: false,
      isMuted: false,
    },
    history: [],
    counters: {
      consecutiveHighMoodSessions: 0,
      lastShiningMomentAt: null,
      sessionStartMood: 60,
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return deepMerge(defaultState(), parsed);
  } catch (e) {
    console.warn('[storage] corrupted state, resetting to default', e);
    return defaultState();
  }
}

export function saveState(state) {
  try {
    state.pet.lastActiveAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[storage] saveState failed', e);
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}
