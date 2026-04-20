// src/main.js
// 進入點：組合所有模組並啟動 Alpine 組件。
// Phase 1 MVP Task 10：接上老師控制面板；真麥克風在 Task 14 接上。

import { loadState, saveState } from './state/storage.js';
import { createMoodEngine } from './state/moodEngine.js';
import { getNextStageProgress, getStageFromExp } from './state/petState.js';
import { unlockForStage } from './state/skillSystem.js';
import { petDisplayComponent } from './ui/petDisplay.js';
import { controlsComponent } from './ui/controls.js';
import { settingsModalComponent } from './ui/settings.js';
import { notificationsComponent, notify } from './ui/notifications.js';
import { exportToJson, importFromJsonFile } from './state/exportImport.js';

// 載入狀態
const state = loadState();
const engine = createMoodEngine({ initialMood: state.pet.currentMood });
let lastStage = state.pet.stage;

// Task 12 階段：用假音量驅動 + 升階通知；真麥克風在 Task 14 接上。
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

  // 升階偵測 + 技能解鎖
  const currentStage = getStageFromExp(state.pet.totalExp, state.settings.stageThresholds);
  if (currentStage !== lastStage) {
    const skill = unlockForStage(currentStage, state.skills.unlocked);
    if (skill) {
      state.skills.unlocked.push({ ...skill, unlockedAt: new Date().toISOString() });
    }
    state.pet.stage = currentStage;
    if (!state.settings.isMuted) {
      const skillMsg = skill ? ` 學會新技能：${skill.name}！` : '';
      notify('🎉 升階了！', `${state.pet.name} 進化到 ${currentStage}！${skillMsg}`);
    }
    lastStage = currentStage;
  }

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

  window.Alpine.data('settingsModal', () => settingsModalComponent({
    getState: () => state,
    onRenamePet: (name) => {
      state.pet.name = name;
      saveState(state);
    },
    onApplyThresholdPreset: (thresholds, preset) => {
      state.settings.stageThresholds = thresholds;
      state.settings.thresholdPreset = preset;
      saveState(state);
    },
    onRecalibrate: () => {
      state.settings.calibration.baselineDb = null;
      state.settings.calibration.calibratedAt = null;
      saveState(state);
      // Task 14 會在啟動時偵測到 baselineDb=null 並觸發校準畫面
      location.reload();
    },
    onExport: exportToJson,
    onImport: importFromJsonFile,
  }));

  window.Alpine.data('notifications', notificationsComponent);
});

// PWA: 註冊 service worker 讓電子寵物可離線使用
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  });
}

console.log('[main] booted. 試試 window.__setFakeVerdict("veryLoud") 看狀態切換');
