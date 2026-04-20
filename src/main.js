// src/main.js
// 進入點：組合所有模組並啟動 Alpine 組件。
// Phase 1 MVP Task 10：接上老師控制面板；真麥克風在 Task 14 接上。

import { loadState, saveState } from './state/storage.js';
import { createMoodEngine } from './state/moodEngine.js';
import { getNextStageProgress } from './state/petState.js';
import { petDisplayComponent } from './ui/petDisplay.js';
import { controlsComponent } from './ui/controls.js';

// 載入狀態
const state = loadState();
const engine = createMoodEngine({ initialMood: state.pet.currentMood });

// Task 10 階段：用假音量驅動，方便測試 UI
// 在瀏覽器 console 可以手動呼叫：
//   window.__setFakeVerdict('veryLoud' | 'loud' | 'acceptable' | 'quiet')
let fakeVerdict = 'quiet';
window.__setFakeVerdict = (v) => { fakeVerdict = v; };

function currentMode() {
  if (state.settings.isPaused) return 'paused';
  return state.settings.currentMode;
}

// 主 tick：每秒跑一次
setInterval(() => {
  engine.tick(fakeVerdict, currentMode());
  state.pet.currentMood = engine.getMood();
  state.pet.totalExp = (state.pet.totalExp || 0) + engine.consumeSessionExp();
  saveState(state);
}, 1000);

// 註冊 Alpine 組件
document.addEventListener('alpine:init', () => {
  window.Alpine.data('petDisplay', () => petDisplayComponent({
    getMood: () => engine.getMood(),
    getVisualState: () => engine.getVisualState(),
    getStageInfo: () => getNextStageProgress(
      state.pet.totalExp,
      state.settings.stageThresholds,
    ),
  }));

  window.Alpine.data('controls', () => controlsComponent({
    getState: () => state,
    onModeChange: (mode) => {
      state.settings.currentMode = mode;
      saveState(state);
    },
    onAdjust: (mode, adjustment) => {
      state.settings.modes[mode].adjustment = adjustment;
      saveState(state);
    },
    onPause: () => {
      state.settings.isPaused = true;
      saveState(state);
    },
    onResume: () => {
      state.settings.isPaused = false;
      saveState(state);
    },
    onToggleMute: (muted) => {
      state.settings.isMuted = muted;
      saveState(state);
    },
    onResetSession: () => {
      engine.resetSession();
      state.pet.currentMood = 60;
      saveState(state);
    },
  }));
});

console.log('[main] booted. 試試 window.__setFakeVerdict("veryLoud") 看狀態切換');
