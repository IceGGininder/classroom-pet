// src/main.js
// 進入點：組合所有模組並啟動 Alpine 組件。
// Phase 1 MVP Task 14：整合真麥克風 + 首次校準。

import { loadState, saveState } from './state/storage.js';
import { createMoodEngine } from './state/moodEngine.js';
import { getNextStageProgress, getStageFromExp } from './state/petState.js';
import { unlockForStage } from './state/skillSystem.js';
import { classifyVolume } from './state/modeConfig.js';
import { createVolumeDetector } from './audio/volumeDetector.js';
import { calibrate } from './audio/calibration.js';
import { petDisplayComponent } from './ui/petDisplay.js';
import { controlsComponent } from './ui/controls.js';
import { settingsModalComponent } from './ui/settings.js';
import { notificationsComponent, notify } from './ui/notifications.js';
import { exportToJson, importFromJsonFile } from './state/exportImport.js';

// 載入狀態
const state = loadState();
const engine = createMoodEngine({ initialMood: state.pet.currentMood });
const detector = createVolumeDetector();
let lastStage = state.pet.stage;

function currentMode() {
  if (state.settings.isPaused) return 'paused';
  return state.settings.currentMode;
}

// 暴露音量給 UI 顯示
window.__getDb = () => detector.getCurrentDb();

async function ensureCalibrated() {
  if (state.settings.calibration.baselineDb != null) return;

  // 顯示校準 overlay
  const overlay = document.createElement('div');
  overlay.id = 'calibration-overlay';
  overlay.className = 'fixed inset-0 bg-black/80 text-white flex items-center justify-center z-[60]';
  overlay.innerHTML = `
    <div class="text-center max-w-lg px-6">
      <div class="text-5xl mb-6">🎤</div>
      <div class="text-2xl font-bold mb-3">小精靈要認識你們的教室</div>
      <div class="text-sm opacity-80 mb-8">請讓教室保持一般安靜狀態，10 秒後完成校準。</div>
      <button id="calibration-start"
              class="px-6 py-3 bg-sky-500 text-white rounded-lg font-bold text-lg">
        開始校準
      </button>
      <div id="calibration-progress" class="mt-8 text-3xl font-bold hidden">0 / 10 秒</div>
    </div>
  `;
  document.body.appendChild(overlay);

  await new Promise(resolve => {
    overlay.querySelector('#calibration-start').addEventListener('click', async () => {
      overlay.querySelector('#calibration-start').classList.add('hidden');
      overlay.querySelector('#calibration-progress').classList.remove('hidden');
      try {
        const baseline = await calibrate(detector, 10, ({ elapsed, total }) => {
          overlay.querySelector('#calibration-progress').textContent = `${elapsed} / ${total} 秒`;
        });
        state.settings.calibration.baselineDb = baseline;
        state.settings.calibration.calibratedAt = new Date().toISOString();
        saveState(state);
        overlay.remove();
        resolve();
      } catch (e) {
        alert('校準失敗：' + e.message);
        overlay.remove();
        resolve();
      }
    }, { once: true });
  });
}

function startMainTick() {
  setInterval(() => {
    // 麥克風未啟用時，db=null → classifyVolume 回傳 'quiet'（設計哲學：偵測不到=安靜）
    const db = detector.getCurrentDb();
    const verdict = classifyVolume(
      db,
      state.settings.calibration.baselineDb,
      state.settings.currentMode,
      state.settings.modes[state.settings.currentMode].adjustment,
    );

    engine.tick(verdict, currentMode());
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
  console.log('[main] tick loop started');
}

async function boot() {
  // 立即啟動 main tick，UI 先跑起來（不等麥克風）
  startMainTick();

  // 嘗試啟動麥克風（失敗也不中斷 UI）
  try {
    await detector.start();
    console.log('[main] mic started');
  } catch (e) {
    console.warn('[main] mic unavailable:', e.message);
    notify('⚠️ 麥克風不可用', `${e.message}。目前為離線模式（偵測不到 = 安靜）。`);
    return;
  }

  // 有麥克風才跑校準
  await ensureCalibrated();
  console.log('[main] calibration done, baseline:', state.settings.calibration.baselineDb);
}

// 註冊 Alpine 組件（先註冊再 boot，避免競態）
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
      location.reload();
    },
    onExport: exportToJson,
    onImport: importFromJsonFile,
  }));

  window.Alpine.data('notifications', notificationsComponent);

  window.Alpine.data('volumeBar', () => ({
    db: null,
    widthPct: 0,
    init() {
      setInterval(() => {
        this.db = window.__getDb?.() ?? null;
        // -80 ~ 0 dB 映射到 0 ~ 100%
        this.widthPct = this.db == null ? 0 : Math.max(0, Math.min(100, (this.db + 80)));
      }, 100);
    },
  }));
});

// PWA: 註冊 service worker 讓電子寵物可離線使用
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  });
}

// 啟動
boot();
