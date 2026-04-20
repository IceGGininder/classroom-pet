# 課堂自制電子寵物 — Phase 1 MVP 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出一個可離線運作的網頁版班級電子寵物 MVP，具備音量偵測、6 階段成長、心情值防抖機制、老師控制面板，能給老師試用。

**Architecture:** 純前端（Vanilla JS + Alpine.js + Tailwind CDN）、無 build 步驟、localStorage 儲存、PWA 可離線、模組化 ES Modules。核心邏輯（MoodEngine、SkillSystem）純函式並走 TDD；UI 與 Web Audio API 手動測試。

**Tech Stack:**
- 執行環境：Chrome / Edge 瀏覽器
- 框架：Alpine.js 3.x（CDN）、Tailwind CSS 3.x（CDN）
- 音訊：Web Audio API（瀏覽器內建）
- 儲存：localStorage + JSON 檔匯出匯入
- 部署：Cloudflare Pages（靜態）
- 測試：Vitest + happy-dom（dev-only）
- 圖素：Phase 1 先用 emoji + CSS；Phase 2 升級 AI 生圖

**設計規格文件（此 plan 的依據）：** `docs/design.md`

---

## 檔案結構（Phase 1 目標狀態）

```
classroom-pet/
├── index.html                    # 單頁進入點（掛 Alpine、載入 CSS）
├── manifest.webmanifest          # PWA manifest
├── service-worker.js             # PWA offline cache
├── src/
│   ├── main.js                   # 進入點：組合所有模組、註冊 Alpine 組件
│   ├── audio/
│   │   ├── volumeDetector.js     # Web Audio API 封裝：RMS 計算 + moving average
│   │   └── calibration.js        # 首次 10 秒校準流程
│   ├── state/
│   │   ├── storage.js            # localStorage 讀寫封裝 + schema default
│   │   ├── moodEngine.js         # 心情值引擎（純函式、含滯後+防抖）
│   │   ├── petState.js           # 寵物狀態：階段、經驗、升階判斷
│   │   ├── skillSystem.js        # 技能解鎖邏輯（N 級 6 個）
│   │   └── modeConfig.js         # 模式閾值定義（focus/discuss/free）
│   └── ui/
│       ├── petDisplay.js         # Alpine 組件：寵物視覺 + 背景
│       ├── controls.js           # Alpine 組件：控制列 + 設定 modal
│       └── notifications.js      # 通知佇列 + 靜音模式
├── tests/
│   ├── moodEngine.test.js        # 心情值引擎單元測試
│   ├── skillSystem.test.js       # 技能解鎖單元測試
│   ├── storage.test.js           # localStorage 封裝測試
│   └── petState.test.js          # 階段進展測試
├── assets/
│   ├── icon-192.png              # PWA icon
│   └── icon-512.png              # PWA icon
├── package.json                  # dev dependencies (Vitest only)
├── vitest.config.js
├── .gitignore
└── README.md
```

**模組職責邊界：**
- `state/` 目錄內全部為純邏輯、可單獨測試、不依賴 DOM
- `audio/` 封裝 Web Audio API，上層不需要懂瀏覽器 API
- `ui/` 只負責呈現與事件綁定，不含業務邏輯
- `main.js` 是唯一知道全部的地方，負責組合

---

## 任務列表總覽

| Task | 主題 | 依賴 |
|---|---|---|
| 1 | 專案骨架 + Git + Vitest | — |
| 2 | Storage 模組（localStorage 封裝） | 1 |
| 3 | MoodEngine 核心邏輯（含防抖） | 1 |
| 4 | PetState（階段進展） | 3 |
| 5 | SkillSystem（N 級技能解鎖） | 4 |
| 6 | ModeConfig（三模式閾值） | 1 |
| 7 | VolumeDetector（Web Audio API） | 1 |
| 8 | Calibration（10 秒校準流程） | 7 |
| 9 | UI: 主畫面 + 寵物顯示 | 3, 4, 5 |
| 10 | UI: 老師控制面板 | 9 |
| 11 | 設定 Modal + JSON 匯出匯入 | 2, 10 |
| 12 | 通知系統 + 靜音模式 | 10 |
| 13 | PWA 設定 | 1-12 |
| 14 | 整合測試 + 手動驗收 | 1-13 |

---

## Task 1: 專案骨架 + Git + Vitest

**Files:**
- Create: `D:/CCdesk/Projects/classroom-pet/.gitignore`
- Create: `D:/CCdesk/Projects/classroom-pet/package.json`
- Create: `D:/CCdesk/Projects/classroom-pet/vitest.config.js`
- Create: `D:/CCdesk/Projects/classroom-pet/index.html`
- Create: `D:/CCdesk/Projects/classroom-pet/README.md`
- Create: `D:/CCdesk/Projects/classroom-pet/tests/smoke.test.js`

- [ ] **Step 1.1: 初始化 git**

```bash
cd D:/CCdesk/Projects/classroom-pet
git init
git branch -M main
```

- [ ] **Step 1.2: 寫 .gitignore**

檔案 `.gitignore`：
```
node_modules/
.DS_Store
*.log
dist/
.vscode/
coverage/
```

- [ ] **Step 1.3: 寫 package.json**

```json
{
  "name": "classroom-pet",
  "version": "0.1.0",
  "type": "module",
  "description": "課堂自制電子寵物 — 透過音量偵測培養學生自制力",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "dev": "npx serve -p 5173 ."
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "happy-dom": "^14.10.0"
  }
}
```

- [ ] **Step 1.4: 寫 vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 1.5: 寫 index.html（暫時的殼）**

```html
<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>課堂電子寵物</title>
<link rel="manifest" href="./manifest.webmanifest">
<script src="https://cdn.tailwindcss.com"></script>
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script type="module" src="./src/main.js"></script>
</head>
<body class="bg-slate-100 text-slate-800">
<div id="app" x-data class="min-h-screen flex items-center justify-center">
  <h1 class="text-3xl font-bold">課堂電子寵物（開發中）</h1>
</div>
</body>
</html>
```

- [ ] **Step 1.6: 寫最小 src/main.js**

```js
// src/main.js
// 進入點：組合所有模組並啟動 Alpine 組件
console.log('classroom-pet booted, version 0.1.0');
```

- [ ] **Step 1.7: 寫 smoke test**

檔案 `tests/smoke.test.js`：
```js
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 1.8: 裝依賴並跑測試**

```bash
cd D:/CCdesk/Projects/classroom-pet
npm install
npm test
```

Expected output：1 test passed。

- [ ] **Step 1.9: 寫 README.md 最小版**

```markdown
# 課堂自制電子寵物

透過音量偵測 + 電子寵物養成概念，培養學生自制力的網頁工具。

## 開發

```bash
npm install
npm test          # 跑單元測試
npm run dev       # 起本地伺服器 localhost:5173
```

## 設計文件

見 `docs/design.md`。

## 實作計畫

見 `docs/plan-phase1.md`。
```

- [ ] **Step 1.10: 第一個 commit**

```bash
git add .
git commit -m "chore: init project scaffold with vitest and alpine shell"
```

---

## Task 2: Storage 模組（localStorage 封裝）

**Files:**
- Create: `src/state/storage.js`
- Create: `tests/storage.test.js`

**職責：** 封裝 localStorage，提供 load / save / reset，並注入預設 schema。
這樣上層不用直接碰 `localStorage.getItem`，且能測試（透過 happy-dom 提供的 `window.localStorage`）。

- [ ] **Step 2.1: 先寫失敗測試**

檔案 `tests/storage.test.js`：
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, saveState, resetState, STORAGE_KEY } from '../src/state/storage.js';

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('loadState returns default schema when empty', () => {
    const s = loadState();
    expect(s.version).toBe('1.0');
    expect(s.pet.stage).toBe('egg');
    expect(s.pet.totalExp).toBe(0);
    expect(s.pet.currentMood).toBe(60);
    expect(s.settings.soundEnabled).toBe(true);
    expect(s.skills.unlocked).toEqual([]);
  });

  it('saveState persists to localStorage', () => {
    const s = loadState();
    s.pet.totalExp = 123;
    saveState(s);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toContain('123');
  });

  it('loadState reads back what saveState wrote', () => {
    const s = loadState();
    s.pet.name = '小乖';
    saveState(s);
    const reloaded = loadState();
    expect(reloaded.pet.name).toBe('小乖');
  });

  it('resetState clears to default', () => {
    const s = loadState();
    s.pet.totalExp = 999;
    saveState(s);
    resetState();
    const reloaded = loadState();
    expect(reloaded.pet.totalExp).toBe(0);
  });

  it('loadState gracefully handles corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const s = loadState();
    expect(s.pet.stage).toBe('egg');
  });
});
```

- [ ] **Step 2.2: 跑測試確認失敗**

```bash
npm test
```

Expected：5 tests fail（module not found）。

- [ ] **Step 2.3: 實作 src/state/storage.js**

```js
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
    // 合併預設值防止舊版本缺欄位
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
```

- [ ] **Step 2.4: 跑測試確認通過**

```bash
npm test
```

Expected：6 tests pass（含 smoke）。

- [ ] **Step 2.5: Commit**

```bash
git add src/state/storage.js tests/storage.test.js
git commit -m "feat(storage): add localStorage wrapper with default schema"
```

---

## Task 3: MoodEngine 核心邏輯（含防抖）

**Files:**
- Create: `src/state/moodEngine.js`
- Create: `tests/moodEngine.test.js`

**職責：** 心情值引擎。接收每秒音量判讀，輸出 (1) 內部心情值 (2) 視覺狀態。
實作三層防抖：滯後閾值（差 6 分）、不對稱連續秒數（退 10 / 升 5）、狀態機。

這是整個系統最核心的邏輯，必須完整 TDD。

- [ ] **Step 3.1: 先寫失敗測試**

檔案 `tests/moodEngine.test.js`：
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createMoodEngine } from '../src/state/moodEngine.js';

describe('MoodEngine - 心情值累積', () => {
  it('初始心情值為 60、視覺狀態為 calm', () => {
    const eng = createMoodEngine();
    expect(eng.getMood()).toBe(60);
    expect(eng.getVisualState()).toBe('calm');
  });

  it('安靜 (+0.3/秒) 會讓心情值上升', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 10; i++) eng.tick('quiet', 'focus');
    expect(eng.getMood()).toBeCloseTo(63, 1);
  });

  it('超吵 (-1.5/秒) 會讓心情值下降', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 10; i++) eng.tick('veryLoud', 'focus');
    expect(eng.getMood()).toBeCloseTo(45, 1);
  });

  it('心情值不會超過 100 或低於 0', () => {
    const eng = createMoodEngine({ initialMood: 99.8 });
    for (let i = 0; i < 100; i++) eng.tick('quiet', 'focus');
    expect(eng.getMood()).toBe(100);
    for (let i = 0; i < 1000; i++) eng.tick('veryLoud', 'focus');
    expect(eng.getMood()).toBe(0);
  });

  it('自由模式下不累積也不扣減', () => {
    const eng = createMoodEngine({ initialMood: 70 });
    for (let i = 0; i < 20; i++) eng.tick('veryLoud', 'free');
    expect(eng.getMood()).toBe(70);
  });

  it('暫停狀態不變動心情值', () => {
    const eng = createMoodEngine({ initialMood: 70 });
    for (let i = 0; i < 20; i++) eng.tick('veryLoud', 'paused');
    expect(eng.getMood()).toBe(70);
  });
});

describe('MoodEngine - 視覺狀態切換（滯後 6 分 + 不對稱時間）', () => {
  it('升到 happy 需連續 5 秒心情 ≥ 83', () => {
    const eng = createMoodEngine({ initialMood: 82 });
    // 每秒 tick 一次，心情值 +0.3
    for (let i = 0; i < 4; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('calm'); // 還沒滿 5 秒
    expect(eng.getMood()).toBeCloseTo(83.2, 1);
    for (let i = 0; i < 1; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('happy'); // 滿 5 秒
  });

  it('從 happy 退到 calm 需連續 10 秒心情 < 77', () => {
    const eng = createMoodEngine({ initialMood: 85, initialState: 'happy' });
    // 吵 9 秒
    for (let i = 0; i < 9; i++) eng.tick('loud', 'focus');
    expect(eng.getMood()).toBeCloseTo(80.5, 1); // 85 - 0.5*9 = 80.5, 仍 > 77
    expect(eng.getVisualState()).toBe('happy');
    // 繼續吵，心情掉到 77 以下
    for (let i = 0; i < 10; i++) eng.tick('loud', 'focus');
    // 此時心情約 75.5，已連續 10 秒 < 77
    expect(eng.getVisualState()).toBe('calm');
  });

  it('短暫尖峰（3 秒 veryLoud）不會觸發狀態切換', () => {
    const eng = createMoodEngine({ initialMood: 70, initialState: 'calm' });
    for (let i = 0; i < 3; i++) eng.tick('veryLoud', 'focus');
    // 心情掉到約 65.5，但未連續 10 秒
    expect(eng.getVisualState()).toBe('calm');
  });

  it('害怕狀態恢復到擔心僅需 5 秒安靜', () => {
    const eng = createMoodEngine({ initialMood: 15, initialState: 'scared' });
    for (let i = 0; i < 5; i++) eng.tick('quiet', 'focus');
    // 心情 15 + 0.3*5 = 16.5，未達 23（害怕退出門檻）
    expect(eng.getVisualState()).toBe('scared');
    // 繼續安靜
    for (let i = 0; i < 25; i++) eng.tick('quiet', 'focus');
    // 心情 = 16.5 + 0.3*25 = 24，超過 23，連續 5 秒後切換
    expect(eng.getVisualState()).toBe('worried');
  });

  it('連續秒數計時器會在心情值跨回閾值時重置', () => {
    const eng = createMoodEngine({ initialMood: 82, initialState: 'calm' });
    // 安靜 3 秒，心情升到 82.9，接近 83
    for (let i = 0; i < 3; i++) eng.tick('quiet', 'focus');
    // 此時 happy 計時器累積 3 秒但心情還沒到 83
    // 吵 1 秒
    eng.tick('loud', 'focus');
    // 心情掉到 82.4，計時器重置
    // 現在安靜 5 秒
    for (let i = 0; i < 5; i++) eng.tick('quiet', 'focus');
    // 心情 = 82.4 + 0.3*5 = 83.9，但計時器才 2 秒（第一次超過 83 是在第 3 秒）
    // 要滿 5 秒才升 happy
    expect(eng.getVisualState()).toBe('calm');
  });
});

describe('MoodEngine - 模式倍率差異', () => {
  it('討論模式下偏吵的扣分較小 (-0.2)', () => {
    const eng = createMoodEngine({ initialMood: 70 });
    for (let i = 0; i < 10; i++) eng.tick('loud', 'discuss');
    expect(eng.getMood()).toBeCloseTo(68, 1); // 70 - 0.2*10
  });
});

describe('MoodEngine - 經驗值累積', () => {
  it('每次安靜 tick 在任何模式（除 free/paused）累積經驗值', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 100; i++) eng.tick('quiet', 'focus');
    // 假設公式：安靜每秒 +1 exp
    expect(eng.getSessionExp()).toBe(100);
  });

  it('自由模式不累積經驗值', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 100; i++) eng.tick('quiet', 'free');
    expect(eng.getSessionExp()).toBe(0);
  });

  it('重置當前節次不清除總心情，但清除計時器', () => {
    const eng = createMoodEngine({ initialMood: 50 });
    for (let i = 0; i < 5; i++) eng.tick('veryLoud', 'focus');
    eng.resetSession();
    expect(eng.getMood()).toBe(60); // 回到起始
    expect(eng.getSessionExp()).toBe(0);
  });
});
```

- [ ] **Step 3.2: 跑測試確認失敗**

```bash
npm test -- moodEngine
```

Expected：module not found, all fail。

- [ ] **Step 3.3: 實作 src/state/moodEngine.js**

```js
// src/state/moodEngine.js
// 心情值引擎（純函式工廠）。三層防抖：滯後 6 分 + 連續秒數 + 狀態機。
// verdict：'quiet' | 'acceptable' | 'loud' | 'veryLoud'
// mode：'focus' | 'discuss' | 'free' | 'paused'
// visualState：'happy' | 'calm' | 'worried' | 'scared'

const MOOD_DELTA = {
  focus:   { quiet: +0.3, acceptable: 0, loud: -0.5, veryLoud: -1.5 },
  discuss: { quiet: +0.3, acceptable: 0, loud: -0.2, veryLoud: -0.6 },
  free:    { quiet: 0,    acceptable: 0, loud: 0,    veryLoud: 0 },
  paused:  { quiet: 0,    acceptable: 0, loud: 0,    veryLoud: 0 },
};

// 滯後閾值表：[降退出, 升進入]
const STATE_THRESHOLDS = {
  happy:    { enter: 83, exit: 77 },
  worried:  { enter: 47, exit: 53 },
  scared:   { enter: 17, exit: 23 },
};

// 不對稱連續秒數
const HYSTERESIS_SECONDS = {
  toHappier: 5,    // 恢復方向（開心 ↑）
  toSadder: 10,    // 退步方向（難過 ↓）
};

export function createMoodEngine(options = {}) {
  let mood = options.initialMood ?? 60;
  let visualState = options.initialState ?? 'calm';
  let candidateState = visualState;
  let candidateSeconds = 0;
  let sessionExp = 0;

  function determineCandidateState(m) {
    // 決定「該進哪個狀態」：以當前 visualState 為基準，帶滯後判斷
    if (visualState === 'scared') {
      if (m >= STATE_THRESHOLDS.scared.exit) return 'worried';
      return 'scared';
    }
    if (visualState === 'worried') {
      if (m <= STATE_THRESHOLDS.scared.enter) return 'scared';
      if (m >= STATE_THRESHOLDS.worried.exit) return 'calm';
      return 'worried';
    }
    if (visualState === 'calm') {
      if (m <= STATE_THRESHOLDS.worried.enter) return 'worried';
      if (m >= STATE_THRESHOLDS.happy.enter) return 'happy';
      return 'calm';
    }
    if (visualState === 'happy') {
      if (m < STATE_THRESHOLDS.happy.exit) return 'calm';
      return 'happy';
    }
    return visualState;
  }

  function stateSadness(s) {
    return { happy: 0, calm: 1, worried: 2, scared: 3 }[s];
  }

  function requiredSeconds(from, to) {
    // 變難過（指數大）→ 10 秒；變開心（指數小）→ 5 秒
    return stateSadness(to) > stateSadness(from)
      ? HYSTERESIS_SECONDS.toSadder
      : HYSTERESIS_SECONDS.toHappier;
  }

  function tick(verdict, mode) {
    const delta = (MOOD_DELTA[mode] ?? MOOD_DELTA.paused)[verdict] ?? 0;
    mood = Math.max(0, Math.min(100, mood + delta));

    // 累積經驗值：僅 focus/discuss 下的 quiet 才加（free/paused 不加）
    if ((mode === 'focus' || mode === 'discuss') && verdict === 'quiet') {
      sessionExp += 1;
    }

    // 判斷視覺狀態
    const target = determineCandidateState(mood);
    if (target === visualState) {
      candidateState = visualState;
      candidateSeconds = 0;
      return;
    }
    if (target !== candidateState) {
      candidateState = target;
      candidateSeconds = 1;
    } else {
      candidateSeconds += 1;
    }
    const required = requiredSeconds(visualState, candidateState);
    if (candidateSeconds >= required) {
      visualState = candidateState;
      candidateSeconds = 0;
    }
  }

  function resetSession() {
    mood = 60;
    visualState = 'calm';
    candidateState = 'calm';
    candidateSeconds = 0;
    sessionExp = 0;
  }

  return {
    tick,
    resetSession,
    getMood: () => mood,
    getVisualState: () => visualState,
    getSessionExp: () => sessionExp,
    // 供 UI 顯示計時進度
    getCandidateState: () => candidateState,
    getCandidateSeconds: () => candidateSeconds,
  };
}
```

- [ ] **Step 3.4: 跑測試確認通過**

```bash
npm test -- moodEngine
```

Expected：所有 moodEngine tests pass。

> 若有 tests 邏輯跑不過，表示我的「進入 happy 還要跨閾值」理解有誤，應修 test 或邏輯，**不要**為了讓測試通過而降低嚴謹度。

- [ ] **Step 3.5: Commit**

```bash
git add src/state/moodEngine.js tests/moodEngine.test.js
git commit -m "feat(moodEngine): add mood engine with 3-layer debounce"
```

---

## Task 4: PetState（階段進展）

**Files:**
- Create: `src/state/petState.js`
- Create: `tests/petState.test.js`

**職責：** 依經驗值判斷寵物階段、觸發升階事件、回傳下一階段進度。

- [ ] **Step 4.1: 先寫失敗測試**

檔案 `tests/petState.test.js`：
```js
import { describe, it, expect } from 'vitest';
import { getStageFromExp, getNextStageProgress, STAGES } from '../src/state/petState.js';

const defaultThresholds = [0, 300, 800, 1800, 3500, 6000];

describe('petState.getStageFromExp', () => {
  it('0 exp → egg', () => {
    expect(getStageFromExp(0, defaultThresholds)).toBe('egg');
  });

  it('299 exp → egg', () => {
    expect(getStageFromExp(299, defaultThresholds)).toBe('egg');
  });

  it('300 exp → newborn', () => {
    expect(getStageFromExp(300, defaultThresholds)).toBe('newborn');
  });

  it('800 exp → young', () => {
    expect(getStageFromExp(800, defaultThresholds)).toBe('young');
  });

  it('1800 exp → growth', () => {
    expect(getStageFromExp(1800, defaultThresholds)).toBe('growth');
  });

  it('6000+ exp → final', () => {
    expect(getStageFromExp(6000, defaultThresholds)).toBe('final');
    expect(getStageFromExp(99999, defaultThresholds)).toBe('final');
  });
});

describe('petState.getNextStageProgress', () => {
  it('450 exp 在 newborn 階段 → 下一階段 young(800)，進度 30% (450-300)/(800-300)', () => {
    const p = getNextStageProgress(450, defaultThresholds);
    expect(p.currentStage).toBe('newborn');
    expect(p.nextStage).toBe('young');
    expect(p.progress).toBeCloseTo(0.3, 2);
    expect(p.current).toBe(450);
    expect(p.needed).toBe(800);
  });

  it('final 階段 → 無下一階段', () => {
    const p = getNextStageProgress(6500, defaultThresholds);
    expect(p.currentStage).toBe('final');
    expect(p.nextStage).toBe(null);
    expect(p.progress).toBe(1);
  });
});

describe('petState.STAGES', () => {
  it('6 階段依序定義', () => {
    expect(STAGES).toEqual(['egg', 'newborn', 'young', 'growth', 'advanced', 'final']);
  });
});
```

- [ ] **Step 4.2: 跑測試確認失敗**

```bash
npm test -- petState
```

- [ ] **Step 4.3: 實作 src/state/petState.js**

```js
// src/state/petState.js
// 寵物階段邏輯：依經驗值換算階段、進度。

export const STAGES = ['egg', 'newborn', 'young', 'growth', 'advanced', 'final'];

export function getStageFromExp(exp, thresholds) {
  // thresholds 是 6 個遞增的數字，對應 STAGES
  let stageIdx = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (exp >= thresholds[i]) stageIdx = i;
  }
  return STAGES[stageIdx];
}

export function getNextStageProgress(exp, thresholds) {
  const currentStage = getStageFromExp(exp, thresholds);
  const currentIdx = STAGES.indexOf(currentStage);
  if (currentIdx === STAGES.length - 1) {
    return {
      currentStage,
      nextStage: null,
      progress: 1,
      current: exp,
      needed: thresholds[currentIdx],
    };
  }
  const floor = thresholds[currentIdx];
  const ceiling = thresholds[currentIdx + 1];
  const progress = (exp - floor) / (ceiling - floor);
  return {
    currentStage,
    nextStage: STAGES[currentIdx + 1],
    progress,
    current: exp,
    needed: ceiling,
  };
}
```

- [ ] **Step 4.4: 跑測試確認通過**

```bash
npm test -- petState
```

- [ ] **Step 4.5: Commit**

```bash
git add src/state/petState.js tests/petState.test.js
git commit -m "feat(petState): add stage progression logic"
```

---

## Task 5: SkillSystem（N 級技能解鎖）

**Files:**
- Create: `src/state/skillSystem.js`
- Create: `tests/skillSystem.test.js`

**職責：** 給定當前階段 + 已解鎖清單，判斷本次升階要解鎖哪個技能。

- [ ] **Step 5.1: 先寫失敗測試**

檔案 `tests/skillSystem.test.js`：
```js
import { describe, it, expect } from 'vitest';
import { N_SKILLS, unlockForStage } from '../src/state/skillSystem.js';

describe('skillSystem.N_SKILLS', () => {
  it('共 6 個 N 級技能，對應 6 個階段', () => {
    expect(N_SKILLS.length).toBe(6);
    expect(N_SKILLS.map(s => s.stage)).toEqual([
      'egg', 'newborn', 'young', 'growth', 'advanced', 'final',
    ]);
  });

  it('每個技能有 id、name、rarity=N', () => {
    for (const s of N_SKILLS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.rarity).toBe('N');
    }
  });
});

describe('skillSystem.unlockForStage', () => {
  it('升到 newborn 應解鎖 "spin"', () => {
    const result = unlockForStage('newborn', []);
    expect(result?.id).toBe('spin');
  });

  it('已解鎖過的技能不重複給', () => {
    const already = [{ id: 'spin', rarity: 'N' }];
    const result = unlockForStage('newborn', already);
    expect(result).toBe(null);
  });

  it('階段沒有對應技能時回傳 null', () => {
    const result = unlockForStage('nonexistent', []);
    expect(result).toBe(null);
  });
});
```

- [ ] **Step 5.2: 跑測試確認失敗**

- [ ] **Step 5.3: 實作 src/state/skillSystem.js**

```js
// src/state/skillSystem.js
// 技能解鎖邏輯。MVP 只有 N 級；R/SR/SSR 抽卡留給 Phase 2。

export const N_SKILLS = [
  { id: 'egg_wiggle',  stage: 'egg',      name: '蛋搖晃',    rarity: 'N' },
  { id: 'spin',        stage: 'newborn',  name: '轉圈',      rarity: 'N' },
  { id: 'bubbles',     stage: 'young',    name: '彩色泡泡',  rarity: 'N' },
  { id: 'magic_hat',   stage: 'growth',   name: '魔法帽',    rarity: 'N' },
  { id: 'wings',       stage: 'advanced', name: '小翅膀',    rarity: 'N' },
  { id: 'singing',     stage: 'final',    name: '唱歌',      rarity: 'N' },
];

export function unlockForStage(stage, alreadyUnlocked) {
  const skill = N_SKILLS.find(s => s.stage === stage);
  if (!skill) return null;
  if (alreadyUnlocked.some(u => u.id === skill.id)) return null;
  return skill;
}
```

- [ ] **Step 5.4: 跑測試確認通過**

- [ ] **Step 5.5: Commit**

```bash
git add src/state/skillSystem.js tests/skillSystem.test.js
git commit -m "feat(skillSystem): add N-level skill unlock logic"
```

---

## Task 6: ModeConfig（三模式閾值）

**Files:**
- Create: `src/state/modeConfig.js`

**職責：** 接收當前校準基線 + 老師微調值，輸出該模式下的 (low, mid, high) dB 閾值、以及判讀函式。

- [ ] **Step 6.1: 實作 src/state/modeConfig.js**

```js
// src/state/modeConfig.js
// 音量判讀：給定 dB 值 + 當前模式 + 校準基線，判讀 quiet/acceptable/loud/veryLoud。

export const DEFAULT_OFFSETS = {
  focus:   [3, 6, 10],
  discuss: [8, 12, 18],
  free:    [15, 22, 30],
};

export function computeThresholds(baselineDb, mode, adjustment = 0) {
  const offsets = DEFAULT_OFFSETS[mode] ?? DEFAULT_OFFSETS.focus;
  // adjustment 是老師微調，每 +1 代表更嚴格（閾值下降 1dB）
  return offsets.map(o => baselineDb + o - adjustment);
}

export function classifyVolume(db, baselineDb, mode, adjustment = 0) {
  if (db == null || baselineDb == null) return 'quiet'; // 偵測不到 = 安靜
  const [low, mid, high] = computeThresholds(baselineDb, mode, adjustment);
  if (db < low) return 'quiet';
  if (db < mid) return 'acceptable';
  if (db < high) return 'loud';
  return 'veryLoud';
}
```

- [ ] **Step 6.2: 寫測試**

檔案 `tests/modeConfig.test.js`：
```js
import { describe, it, expect } from 'vitest';
import { classifyVolume, computeThresholds } from '../src/state/modeConfig.js';

describe('modeConfig.classifyVolume', () => {
  const baseline = -50;

  it('低於 baseline+3 → quiet (focus)', () => {
    expect(classifyVolume(-48, baseline, 'focus')).toBe('quiet');
  });

  it('baseline+4 → acceptable (focus)', () => {
    expect(classifyVolume(-46, baseline, 'focus')).toBe('acceptable');
  });

  it('baseline+8 → loud (focus)', () => {
    expect(classifyVolume(-42, baseline, 'focus')).toBe('loud');
  });

  it('baseline+12 → veryLoud (focus)', () => {
    expect(classifyVolume(-38, baseline, 'focus')).toBe('veryLoud');
  });

  it('偵測不到（null）視為 quiet（設計哲學）', () => {
    expect(classifyVolume(null, baseline, 'focus')).toBe('quiet');
  });

  it('老師微調 +2 會使閾值更嚴格', () => {
    const t = computeThresholds(baseline, 'focus', 2);
    expect(t).toEqual([-49, -46, -42]); // baseline + (3-2, 6-2, 10-2) = -50+1, -50+4, -50+8
  });
});
```

- [ ] **Step 6.3: 跑測試確認通過**

```bash
npm test -- modeConfig
```

- [ ] **Step 6.4: Commit**

```bash
git add src/state/modeConfig.js tests/modeConfig.test.js
git commit -m "feat(modeConfig): add volume classifier for three modes"
```

---

## Task 7: VolumeDetector（Web Audio API 封裝）

**Files:**
- Create: `src/audio/volumeDetector.js`

**職責：** 封裝 Web Audio API，提供 start / stop / getCurrentDb。採 RMS + 3 秒 moving average 平滑。

**不走 TDD 的理由：** Web Audio API 在 happy-dom 無法完整模擬，採手動測試（下一個 task）。本 task 只實作、commit；驗證延後到整合階段。

- [ ] **Step 7.1: 實作 src/audio/volumeDetector.js**

```js
// src/audio/volumeDetector.js
// Web Audio API 封裝。提供 start / stop / getCurrentDb / getBaselineOverSeconds。
// 採 RMS 計算音量、3 秒 moving average 平滑。

const BUFFER_SAMPLES = 1024;
const SMOOTH_SECONDS = 3;
const TICKS_PER_SECOND = 10; // 100ms 一次採樣

export function createVolumeDetector() {
  let audioCtx = null;
  let sourceNode = null;
  let analyser = null;
  let mediaStream = null;
  let intervalId = null;
  const buffer = new Float32Array(BUFFER_SAMPLES);
  const smoothBuffer = []; // 存最近 SMOOTH_SECONDS * TICKS_PER_SECOND 筆
  let currentDb = null;
  let isRunning = false;

  async function start() {
    if (isRunning) return;
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaStreamSource(mediaStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = BUFFER_SAMPLES * 2;
    sourceNode.connect(analyser);

    intervalId = setInterval(sampleTick, 1000 / TICKS_PER_SECOND);
    isRunning = true;
  }

  function sampleTick() {
    if (!analyser) return;
    analyser.getFloatTimeDomainData(buffer);
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
    const rms = Math.sqrt(sumSq / buffer.length);
    // 轉 dB（相對 1.0）
    const db = rms > 0 ? 20 * Math.log10(rms) : -120;

    smoothBuffer.push(db);
    const maxLen = SMOOTH_SECONDS * TICKS_PER_SECOND;
    if (smoothBuffer.length > maxLen) smoothBuffer.shift();
    const avg = smoothBuffer.reduce((s, v) => s + v, 0) / smoothBuffer.length;
    currentDb = avg;
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
    }
    if (audioCtx) audioCtx.close();
    audioCtx = null;
    sourceNode = null;
    analyser = null;
    mediaStream = null;
    smoothBuffer.length = 0;
    currentDb = null;
    isRunning = false;
  }

  function getCurrentDb() {
    return currentDb;
  }

  function getInstantRms() {
    // 供校準使用：取最新一筆（未平滑）
    return smoothBuffer.length > 0 ? smoothBuffer[smoothBuffer.length - 1] : null;
  }

  return {
    start,
    stop,
    getCurrentDb,
    getInstantRms,
    isRunning: () => isRunning,
  };
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/audio/volumeDetector.js
git commit -m "feat(volumeDetector): add Web Audio API wrapper with RMS smoothing"
```

---

## Task 8: Calibration（10 秒校準流程）

**Files:**
- Create: `src/audio/calibration.js`

**職責：** 10 秒採樣取平均 → 得到該教室基線。

- [ ] **Step 8.1: 實作 src/audio/calibration.js**

```js
// src/audio/calibration.js
// 10 秒校準流程。返回平均 dB 作為基線。

export async function calibrate(detector, durationSec = 10, onProgress = () => {}) {
  if (!detector.isRunning()) {
    await detector.start();
  }
  const samples = [];
  return new Promise(resolve => {
    let elapsed = 0;
    const interval = setInterval(() => {
      const db = detector.getCurrentDb();
      if (db != null) samples.push(db);
      elapsed += 1;
      onProgress({ elapsed, total: durationSec });
      if (elapsed >= durationSec) {
        clearInterval(interval);
        if (samples.length === 0) {
          resolve(-50); // fallback
          return;
        }
        const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
        resolve(avg);
      }
    }, 1000);
  });
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/audio/calibration.js
git commit -m "feat(calibration): add 10-second baseline calibration"
```

---

## Task 9: UI — 主畫面 + 寵物顯示

**Files:**
- Modify: `index.html`
- Create: `src/ui/petDisplay.js`
- Modify: `src/main.js`

**職責：** 組合 MoodEngine + PetState 的輸出成為視覺畫面。Phase 1 用 emoji + CSS；Phase 2 再換 AI 圖。

- [ ] **Step 9.1: 建立 src/ui/petDisplay.js**

```js
// src/ui/petDisplay.js
// Alpine 組件：寵物視覺 + 背景 + 心情/階段 bar。

export function petDisplayComponent(deps) {
  // deps: { getMood, getVisualState, getStageInfo }
  return {
    mood: 60,
    visualState: 'calm',
    stageInfo: { currentStage: 'egg', progress: 0, nextStage: 'newborn', current: 0, needed: 300 },

    init() {
      setInterval(() => {
        this.mood = Math.round(deps.getMood());
        this.visualState = deps.getVisualState();
        this.stageInfo = deps.getStageInfo();
      }, 200);
    },

    get petEmoji() {
      return {
        egg: '🥚', newborn: '🐣', young: '🐥',
        growth: '🦊', advanced: '🦄', final: '✨',
      }[this.stageInfo.currentStage];
    },

    get stateIcon() {
      return { happy: '😄', calm: '🙂', worried: '😟', scared: '😱' }[this.visualState];
    },

    get bgClass() {
      return {
        happy:   'bg-gradient-to-b from-sky-200 to-sky-50',
        calm:    'bg-gradient-to-b from-slate-100 to-slate-50',
        worried: 'bg-gradient-to-b from-slate-300 to-slate-200',
        scared:  'bg-gradient-to-b from-slate-600 to-slate-800 text-white',
      }[this.visualState];
    },

    get petAnimationClass() {
      return {
        happy:   'animate-bounce',
        calm:    '',
        worried: 'opacity-60 translate-y-4',
        scared:  'opacity-20 translate-y-12',
      }[this.visualState];
    },
  };
}
```

- [ ] **Step 9.2: 修改 index.html 的 body 部分**

```html
<body class="bg-slate-100 text-slate-800">
<div x-data="petDisplay" :class="bgClass" class="min-h-screen flex flex-col transition-colors duration-1000">
  <!-- 寵物區 -->
  <div class="flex-1 flex items-center justify-center relative">
    <div class="text-center transition-all duration-1000" :class="petAnimationClass">
      <div class="text-[200px] leading-none" x-text="petEmoji"></div>
      <div class="text-4xl mt-4" x-text="stateIcon"></div>
      <div class="mt-8 text-sm opacity-60" x-show="visualState === 'scared'">
        太吵了...小精靈不敢出來
      </div>
    </div>
  </div>

  <!-- 資訊列 -->
  <div class="bg-white/80 backdrop-blur p-4 flex items-center justify-between border-t">
    <div class="flex items-center gap-4">
      <div>
        <div class="text-xs opacity-60">心情</div>
        <div class="font-bold" x-text="mood"></div>
      </div>
      <div>
        <div class="text-xs opacity-60">階段</div>
        <div class="font-bold" x-text="stageInfo.currentStage"></div>
      </div>
    </div>
    <div class="flex-1 mx-8">
      <div class="text-xs opacity-60 mb-1">
        <span x-text="stageInfo.current"></span> / <span x-text="stageInfo.needed"></span> 經驗值
      </div>
      <div class="bg-slate-200 rounded-full h-2 overflow-hidden">
        <div class="bg-sky-500 h-full transition-all duration-500"
             :style="`width: ${stageInfo.progress * 100}%`"></div>
      </div>
    </div>
  </div>
</div>
</body>
```

- [ ] **Step 9.3: 修改 src/main.js 接上**

```js
// src/main.js
import { loadState, saveState } from './state/storage.js';
import { createMoodEngine } from './state/moodEngine.js';
import { getNextStageProgress } from './state/petState.js';
import { classifyVolume } from './state/modeConfig.js';
import { petDisplayComponent } from './ui/petDisplay.js';

// 載入狀態
const state = loadState();
const engine = createMoodEngine({ initialMood: state.pet.currentMood });

// 每秒 tick 一次（Phase 1 先用假音量，Task 14 再接真麥克風）
let fakeMode = 'focus';
let fakeVerdict = 'quiet';
window.__setFakeVerdict = (v) => { fakeVerdict = v; };
window.__setFakeMode = (m) => { fakeMode = m; };

setInterval(() => {
  engine.tick(fakeVerdict, fakeMode);
  state.pet.currentMood = engine.getMood();
  state.pet.totalExp = (state.pet.totalExp || 0); // Task 14 時接 session exp flush
  saveState(state);
}, 1000);

// 註冊 Alpine 組件
document.addEventListener('alpine:init', () => {
  window.Alpine.data('petDisplay', () => petDisplayComponent({
    getMood: () => engine.getMood(),
    getVisualState: () => engine.getVisualState(),
    getStageInfo: () => getNextStageProgress(state.pet.totalExp, state.settings.stageThresholds),
  }));
});

console.log('[main] booted. 用 window.__setFakeVerdict("veryLoud") 測狀態切換');
```

- [ ] **Step 9.4: 本地開啟測試**

```bash
npm run dev
```

開 `http://localhost:5173`，看到寵物 emoji 與資訊列。

在瀏覽器 console 輸入：
```js
window.__setFakeVerdict('veryLoud');
```
觀察寵物在 10 秒後變 scared（躲起來+背景變暗）。
```js
window.__setFakeVerdict('quiet');
```
觀察 5 秒後恢復。

- [ ] **Step 9.5: Commit**

```bash
git add index.html src/ui/petDisplay.js src/main.js
git commit -m "feat(ui): add pet display with mood-driven animations"
```

---

## Task 10: UI — 老師控制面板

**Files:**
- Create: `src/ui/controls.js`
- Modify: `index.html`
- Modify: `src/main.js`

**職責：** 模式切換、微調 +/-、暫停偵測、重置本節、靜音模式。

- [ ] **Step 10.1: 建立 src/ui/controls.js**

```js
// src/ui/controls.js
// Alpine 組件：老師控制面板。

export function controlsComponent(deps) {
  // deps: { onModeChange, onAdjust, onPause, onResume, onResetSession, onToggleMute, getState }
  return {
    currentMode: 'focus',
    isPaused: false,
    isMuted: false,
    currentAdjustment: 0,

    init() {
      const s = deps.getState();
      this.currentMode = s.settings.currentMode;
      this.isPaused = s.settings.isPaused;
      this.isMuted = s.settings.isMuted;
      this.currentAdjustment = s.settings.modes[this.currentMode].adjustment;
    },

    setMode(mode) {
      this.currentMode = mode;
      this.currentAdjustment = deps.getState().settings.modes[mode].adjustment;
      deps.onModeChange(mode);
    },

    adjust(delta) {
      this.currentAdjustment += delta;
      deps.onAdjust(this.currentMode, this.currentAdjustment);
    },

    togglePause() {
      this.isPaused = !this.isPaused;
      this.isPaused ? deps.onPause() : deps.onResume();
    },

    toggleMute() {
      this.isMuted = !this.isMuted;
      deps.onToggleMute(this.isMuted);
    },

    resetSession() {
      if (confirm('重置本節心情值？')) deps.onResetSession();
    },
  };
}
```

- [ ] **Step 10.2: 修改 index.html 加入控制列**

在 `petDisplay` 的 `<div x-data="petDisplay" ...>` 區塊內、資訊列上方，插入：

```html
  <!-- 控制列 -->
  <div x-data="controls" class="bg-white/90 backdrop-blur p-3 border-t flex flex-wrap items-center gap-2">
    <button @click="setMode('focus')"
            :class="currentMode === 'focus' ? 'bg-sky-600 text-white' : 'bg-slate-200'"
            class="px-4 py-2 rounded-lg font-bold">🤫 專心</button>
    <button @click="setMode('discuss')"
            :class="currentMode === 'discuss' ? 'bg-sky-600 text-white' : 'bg-slate-200'"
            class="px-4 py-2 rounded-lg font-bold">💬 討論</button>
    <button @click="setMode('free')"
            :class="currentMode === 'free' ? 'bg-sky-600 text-white' : 'bg-slate-200'"
            class="px-4 py-2 rounded-lg font-bold">🎨 自由</button>

    <div class="flex items-center ml-2">
      <button @click="adjust(-1)" class="px-3 py-2 bg-slate-200 rounded-l-lg">−</button>
      <span class="px-3 py-2 bg-white border-y text-sm min-w-[3rem] text-center"
            x-text="`${currentAdjustment > 0 ? '+' : ''}${currentAdjustment}`"></span>
      <button @click="adjust(1)" class="px-3 py-2 bg-slate-200 rounded-r-lg">+</button>
    </div>

    <button @click="togglePause()"
            :class="isPaused ? 'bg-amber-500 text-white' : 'bg-slate-200'"
            class="px-4 py-2 rounded-lg ml-2">
      <span x-text="isPaused ? '▶ 繼續偵測' : '⏸ 暫停偵測'"></span>
    </button>

    <button @click="toggleMute()"
            :class="isMuted ? 'bg-slate-700 text-white' : 'bg-slate-200'"
            class="px-4 py-2 rounded-lg">
      <span x-text="isMuted ? '🔕 靜音中' : '🔔 通知開'"></span>
    </button>

    <button @click="resetSession()" class="px-4 py-2 bg-slate-200 rounded-lg ml-auto">
      🔄 重置本節
    </button>
  </div>
```

- [ ] **Step 10.3: 修改 src/main.js 接上控制 callbacks**

加在既有程式碼之下：

```js
import { controlsComponent } from './ui/controls.js';

// 將假模式的設定改成透過 state
function getMode() {
  if (state.settings.isPaused) return 'paused';
  return state.settings.currentMode;
}

// 修改既有的 setInterval，把 fakeMode 改成 getMode()
// 找到：engine.tick(fakeVerdict, fakeMode)
// 改為：engine.tick(fakeVerdict, getMode())

document.addEventListener('alpine:init', () => {
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
```

- [ ] **Step 10.4: 測試**

```bash
npm run dev
```

點三個模式按鈕切換、按 +/-、暫停、靜音、重置，確認狀態變化正確。重整頁面後狀態應保留（localStorage）。

- [ ] **Step 10.5: Commit**

```bash
git add src/ui/controls.js index.html src/main.js
git commit -m "feat(ui): add teacher control panel with mode switching"
```

---

## Task 11: 設定 Modal + JSON 匯出匯入

**Files:**
- Modify: `src/ui/controls.js`（或獨立 `src/ui/settings.js`）
- Modify: `index.html`

**職責：** 右上 ⚙設定 按鈕 → 彈 modal，可改寵物名字、階段門檻預設、重新校準、匯出/匯入 JSON。

- [ ] **Step 11.1: 建立匯出匯入工具**

檔案 `src/state/exportImport.js`：
```js
// src/state/exportImport.js
import { loadState, saveState, STORAGE_KEY } from './storage.js';

export function exportToJson() {
  const state = loadState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `classroom-pet-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromJsonFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.version || !parsed.pet) throw new Error('不是合法的備份檔');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}
```

- [ ] **Step 11.2: 寫設定 modal UI**

在 index.html 控制列後加：

```html
  <!-- 右上設定按鈕 -->
  <button @click="$dispatch('open-settings')"
          class="fixed top-4 right-4 bg-white/90 shadow-lg px-3 py-2 rounded-lg">
    ⚙ 設定
  </button>

  <!-- 設定 Modal -->
  <div x-data="settingsModal"
       x-show="open"
       @open-settings.window="open = true"
       @keydown.escape.window="open = false"
       class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
       style="display: none">
    <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto"
         @click.outside="open = false">
      <h2 class="text-xl font-bold mb-4">⚙ 設定</h2>

      <label class="block mb-4">
        <span class="text-sm font-bold">寵物名字</span>
        <input type="text" x-model="petName" @change="savePetName()"
               class="mt-1 block w-full border rounded px-3 py-2">
      </label>

      <div class="mb-4">
        <div class="text-sm font-bold mb-2">階段門檻預設</div>
        <div class="flex gap-2">
          <button @click="applyPreset('loose')"
                  class="flex-1 px-3 py-2 bg-slate-200 rounded text-sm">寬鬆</button>
          <button @click="applyPreset('standard')"
                  class="flex-1 px-3 py-2 bg-slate-200 rounded text-sm">標準</button>
          <button @click="applyPreset('strict')"
                  class="flex-1 px-3 py-2 bg-slate-200 rounded text-sm">嚴格</button>
        </div>
        <div class="text-xs opacity-60 mt-1" x-text="thresholdDisplay"></div>
      </div>

      <div class="mb-4">
        <button @click="recalibrate()" class="w-full px-3 py-2 bg-amber-500 text-white rounded">
          🔄 重新校準音量基線
        </button>
      </div>

      <div class="mb-4 border-t pt-4">
        <div class="text-sm font-bold mb-2">備份</div>
        <button @click="doExport()" class="w-full mb-2 px-3 py-2 bg-sky-600 text-white rounded">
          📥 匯出 JSON 備份
        </button>
        <label class="block">
          <span class="w-full px-3 py-2 bg-slate-200 rounded block text-center cursor-pointer">
            📤 匯入 JSON 還原
          </span>
          <input type="file" accept=".json" @change="doImport($event)" class="hidden">
        </label>
      </div>

      <button @click="open = false" class="w-full px-3 py-2 border rounded">關閉</button>
    </div>
  </div>
```

- [ ] **Step 11.3: 建立 src/ui/settings.js**

```js
// src/ui/settings.js
export function settingsModalComponent(deps) {
  const PRESETS = {
    loose:    [0, 180, 480, 1080, 2100, 3600],
    standard: [0, 300, 800, 1800, 3500, 6000],
    strict:   [0, 450, 1200, 2700, 5250, 9000],
  };

  return {
    open: false,
    petName: '',

    init() {
      this.petName = deps.getState().pet.name;
    },

    get thresholdDisplay() {
      return deps.getState().settings.stageThresholds.join(' / ');
    },

    savePetName() {
      deps.onRenamePet(this.petName);
    },

    applyPreset(preset) {
      deps.onApplyThresholdPreset(PRESETS[preset], preset);
    },

    recalibrate() {
      if (confirm('要花 10 秒重新校準，請先讓教室保持一般安靜。確定？')) {
        deps.onRecalibrate();
        this.open = false;
      }
    },

    async doExport() {
      deps.onExport();
    },

    async doImport(ev) {
      const file = ev.target.files[0];
      if (!file) return;
      try {
        await deps.onImport(file);
        alert('匯入成功，頁面將重新整理');
        location.reload();
      } catch (e) {
        alert('匯入失敗：' + e.message);
      }
    },
  };
}
```

- [ ] **Step 11.4: 在 main.js 註冊 settings 組件**

```js
import { settingsModalComponent } from './ui/settings.js';
import { exportToJson, importFromJsonFile } from './state/exportImport.js';

// ... 既有 alpine:init 監聽器內再加：
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
    // Task 14 時觸發校準畫面
  },
  onExport: exportToJson,
  onImport: importFromJsonFile,
}));
```

- [ ] **Step 11.5: 測試**

手動點設定、改名、切換 preset、匯出（下載 JSON）、匯入（上傳同一個檔）、重整頁面。

- [ ] **Step 11.6: Commit**

```bash
git add src/state/exportImport.js src/ui/settings.js index.html src/main.js
git commit -m "feat(ui): add settings modal with preset/export/import"
```

---

## Task 12: 通知系統 + 靜音模式

**Files:**
- Create: `src/ui/notifications.js`
- Modify: `src/main.js`

**職責：** 升階、達成里程碑時彈 toast，靜音模式一鍵關。MVP 先做升階通知。

- [ ] **Step 12.1: 實作 src/ui/notifications.js**

```js
// src/ui/notifications.js
export function notificationsComponent() {
  return {
    toasts: [],

    init() {
      window.addEventListener('pet-notify', (e) => {
        const id = Date.now() + Math.random();
        this.toasts.push({ id, ...e.detail });
        setTimeout(() => {
          this.toasts = this.toasts.filter(t => t.id !== id);
        }, 4000);
      });
    },
  };
}

export function notify(title, message, type = 'info') {
  // 靜音模式檢查由呼叫端負責（在 main.js 判斷 state.settings.isMuted）
  window.dispatchEvent(new CustomEvent('pet-notify', {
    detail: { title, message, type },
  }));
}
```

- [ ] **Step 12.2: 修改 main.js 加入升階事件**

```js
import { notify } from './ui/notifications.js';
import { getStageFromExp } from './state/petState.js';
import { unlockForStage } from './state/skillSystem.js';

let lastStage = state.pet.stage;

// 修改既有的 setInterval，除 engine.tick 之外再加入：
setInterval(() => {
  engine.tick(fakeVerdict, getMode());
  state.pet.currentMood = engine.getMood();

  // Flush session exp 到總經驗值（每秒）
  const sessionExp = engine.getSessionExp();
  if (sessionExp > 0) {
    state.pet.totalExp += sessionExp;
    engine.resetSessionExp(); // 需在 moodEngine 加這個方法，或用累積值差
    // 簡化：直接每秒算一次 delta。改造成：
    // 每 tick session exp 會累加，我們要的是「每秒新增的 exp」
    // 改法見下方修正
  }

  // 升階檢查
  const currentStage = getStageFromExp(state.pet.totalExp, state.settings.stageThresholds);
  if (currentStage !== lastStage) {
    const skill = unlockForStage(currentStage, state.skills.unlocked);
    if (skill) {
      state.skills.unlocked.push({ ...skill, unlockedAt: new Date().toISOString() });
    }
    state.pet.stage = currentStage;
    if (!state.settings.isMuted) {
      notify('🎉 升階了！', `${state.pet.name} 進化到 ${currentStage} 了！${skill ? ' 學會新技能：' + skill.name : ''}`);
    }
    lastStage = currentStage;
  }

  saveState(state);
}, 1000);
```

> 注意：`engine.getSessionExp()` 回傳的是累積值。需要在 moodEngine 加 `resetSessionExp` 或改為 `consumeSessionExp`。請在 Task 3 的 moodEngine.js 補上：
> ```js
> function consumeSessionExp() {
>   const v = sessionExp;
>   sessionExp = 0;
>   return v;
> }
> ```
> 並加測試：consumeSessionExp 呼叫後回傳累積、內部歸零。

- [ ] **Step 12.3: index.html 加入 toast 區域**

```html
  <!-- Toast 區 -->
  <div x-data="notifications" class="fixed top-4 right-20 z-40 space-y-2 pointer-events-none">
    <template x-for="t in toasts" :key="t.id">
      <div class="bg-white shadow-xl rounded-lg px-4 py-3 max-w-sm pointer-events-auto animate-[slide-in_0.3s]">
        <div class="font-bold" x-text="t.title"></div>
        <div class="text-sm" x-text="t.message"></div>
      </div>
    </template>
  </div>
```

- [ ] **Step 12.4: 在 main.js 註冊 notifications 組件**

```js
import { notificationsComponent } from './ui/notifications.js';

// alpine:init 內：
window.Alpine.data('notifications', notificationsComponent);
```

- [ ] **Step 12.5: 測試**

在瀏覽器 console 手動設 totalExp 超過門檻：
```js
// 透過匯出匯入或直接改 localStorage 測試
const s = JSON.parse(localStorage.getItem('classroom-pet-state-v1'));
s.pet.totalExp = 290;
localStorage.setItem('classroom-pet-state-v1', JSON.stringify(s));
location.reload();
window.__setFakeVerdict('quiet'); // 等幾秒累積 exp 超過 300
```
觀察升階 toast。

- [ ] **Step 12.6: Commit**

```bash
git add src/ui/notifications.js src/state/moodEngine.js tests/moodEngine.test.js index.html src/main.js
git commit -m "feat: add notifications system with level-up events"
```

---

## Task 13: PWA 設定

**Files:**
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Create: `assets/icon-192.png`（暫時用單色 PNG 佔位）
- Create: `assets/icon-512.png`
- Modify: `src/main.js`

**職責：** 讓老師可「加到主畫面」當 App 用、可離線執行。

- [ ] **Step 13.1: 產生兩張 icon**

用 Python + Pillow 產生簡單的 icon：

```bash
python -c "
from PIL import Image, ImageDraw
for size in [192, 512]:
    im = Image.new('RGB', (size, size), '#0ea5e9')
    d = ImageDraw.Draw(im)
    d.ellipse([size*0.2, size*0.2, size*0.8, size*0.8], fill='white')
    d.text((size*0.4, size*0.4), '🐣', fill='black')
    im.save(f'D:/CCdesk/Projects/classroom-pet/assets/icon-{size}.png')
print('icons generated')
"
```

> 若 PIL 不支援 emoji 字型，先用純色圖即可，Phase 2 再用 AI 生。

- [ ] **Step 13.2: 寫 manifest.webmanifest**

```json
{
  "name": "課堂電子寵物",
  "short_name": "電子寵物",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#f1f5f9",
  "theme_color": "#0ea5e9",
  "orientation": "landscape",
  "lang": "zh-Hant",
  "icons": [
    { "src": "./assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 13.3: 寫 service-worker.js**

```js
// service-worker.js
const CACHE = 'classroom-pet-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/main.js',
  './src/audio/volumeDetector.js',
  './src/audio/calibration.js',
  './src/state/storage.js',
  './src/state/moodEngine.js',
  './src/state/petState.js',
  './src/state/skillSystem.js',
  './src/state/modeConfig.js',
  './src/state/exportImport.js',
  './src/ui/petDisplay.js',
  './src/ui/controls.js',
  './src/ui/settings.js',
  './src/ui/notifications.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // 只快取同源資源；CDN 的 Alpine/Tailwind 仍走網路
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return resp;
    }))
  );
});
```

- [ ] **Step 13.4: 在 main.js 註冊 service worker**

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  });
}
```

- [ ] **Step 13.5: 測試 PWA**

```bash
npm run dev
```

打開 Chrome DevTools → Application → Manifest，確認 manifest 載入成功、可 install。網址列右邊應出現「安裝」圖示。安裝後斷網仍可開啟。

- [ ] **Step 13.6: Commit**

```bash
git add manifest.webmanifest service-worker.js assets/ src/main.js
git commit -m "feat: add PWA manifest and service worker for offline use"
```

---

## Task 14: 整合真麥克風 + 首次校準 + 手動驗收

**Files:**
- Modify: `src/main.js`
- Modify: `index.html`

**職責：** 把 VolumeDetector + Calibration 接進主流程，移除 Task 9 的假音量，完成端對端整合。

- [ ] **Step 14.1: 修改 main.js，接上真麥克風**

移除 `__setFakeVerdict` / `__setFakeMode`。主 tick 改為：

```js
import { createVolumeDetector } from './audio/volumeDetector.js';
import { calibrate } from './audio/calibration.js';
import { classifyVolume } from './state/modeConfig.js';

const detector = createVolumeDetector();

async function ensureCalibrated() {
  if (state.settings.calibration.baselineDb != null) return;

  // 顯示校準畫面（簡化：用 confirm + progress 彈窗）
  if (!confirm('首次使用：要花 10 秒校準教室音量。請讓教室保持一般安靜然後按確定。')) return;

  try {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/80 text-white flex items-center justify-center z-50';
    overlay.innerHTML = `<div class="text-center"><div class="text-4xl mb-4">🎤 校準中...</div><div id="calib-progress" class="text-2xl">0 / 10 秒</div></div>`;
    document.body.appendChild(overlay);

    const baseline = await calibrate(detector, 10, ({ elapsed, total }) => {
      overlay.querySelector('#calib-progress').textContent = `${elapsed} / ${total} 秒`;
    });

    state.settings.calibration.baselineDb = baseline;
    state.settings.calibration.calibratedAt = new Date().toISOString();
    saveState(state);
    overlay.remove();
    alert(`校準完成！基線 = ${baseline.toFixed(1)} dB`);
  } catch (e) {
    alert('校準失敗：' + e.message);
  }
}

// 啟動流程
async function boot() {
  try {
    await detector.start();
    await ensureCalibrated();
  } catch (e) {
    alert('無法啟動麥克風：' + e.message);
    return;
  }

  // 主 tick：每秒跑
  setInterval(() => {
    if (state.settings.isPaused) return;
    const db = detector.getCurrentDb();
    const verdict = classifyVolume(
      db,
      state.settings.calibration.baselineDb,
      state.settings.currentMode,
      state.settings.modes[state.settings.currentMode].adjustment,
    );

    engine.tick(verdict, state.settings.currentMode);
    state.pet.currentMood = engine.getMood();
    state.pet.totalExp += engine.consumeSessionExp();

    // 升階檢查（同 Task 12）
    const currentStage = getStageFromExp(state.pet.totalExp, state.settings.stageThresholds);
    if (currentStage !== lastStage) {
      const skill = unlockForStage(currentStage, state.skills.unlocked);
      if (skill) {
        state.skills.unlocked.push({ ...skill, unlockedAt: new Date().toISOString() });
      }
      state.pet.stage = currentStage;
      if (!state.settings.isMuted) {
        notify('🎉 升階了！', `${state.pet.name} 進化到 ${currentStage} 了！`);
      }
      lastStage = currentStage;
    }

    saveState(state);
  }, 1000);
}

boot();
```

- [ ] **Step 14.2: 增加麥克風音量條 UI（在資訊列加一條）**

在 index.html 資訊列下方：

```html
  <div x-data="{ db: null }"
       x-init="setInterval(() => { db = window.__getDb?.() ?? null }, 100)"
       class="px-4 pb-2">
    <div class="bg-slate-200 rounded-full h-1 overflow-hidden">
      <div class="bg-sky-500 h-full transition-all duration-100"
           :style="`width: ${db == null ? 0 : Math.max(0, Math.min(100, (db + 80)))}%`"></div>
    </div>
  </div>
```

在 main.js 暴露：
```js
window.__getDb = () => detector.getCurrentDb();
```

- [ ] **Step 14.3: 手動驗收 checklist**

進入 http://localhost:5173，完成以下操作並確認：

- [ ] 首次開啟會問麥克風權限、完成 10 秒校準
- [ ] 校準完成後音量條有動
- [ ] 大聲說話：寵物在 10 秒後躲起來（worried → scared）
- [ ] 停止說話：寵物在 5 秒後探頭回來
- [ ] 切「自由模式」：任何音量都不影響寵物
- [ ] 切「討論模式」：偏吵扣分較少
- [ ] 按「暫停偵測」：音量條仍動但寵物狀態凍結
- [ ] 按「重置本節」：心情回到 60
- [ ] 按「靜音」：升階時無 toast、但狀態仍更新
- [ ] 設定裡切 preset（寬鬆）：門檻數字變化、之後升階也變容易
- [ ] 匯出 JSON：檔案下載成功、格式正確
- [ ] 匯入相同 JSON：狀態還原成功
- [ ] 重整頁面：所有狀態保留
- [ ] 安裝為 PWA、斷網開啟：仍能正常運作（校準需重做因無歷史）

- [ ] **Step 14.4: 修 bug（如有）**

驗收過程遇到任何 bug 都是子任務：寫失敗 test（若適用）、修、驗、commit。

- [ ] **Step 14.5: Commit**

```bash
git add src/main.js index.html
git commit -m "feat: integrate microphone + calibration + e2e flow"
```

---

## Task 15: 部署到 Cloudflare Pages

**Files:**
- 無新增，主要是 ops。

- [ ] **Step 15.1: 創 GitHub repo**

```bash
cd D:/CCdesk/Projects/classroom-pet
gh repo create classroom-pet --public --source=. --remote=origin --push
```

或手動：
```bash
git remote add origin git@github.com:<your-user>/classroom-pet.git
git push -u origin main
```

- [ ] **Step 15.2: 連 Cloudflare Pages**

登入 Cloudflare → Pages → Create → Connect to GitHub → 選 `classroom-pet` repo → Deploy。

- Build command：（空白）
- Build output directory：`/`
- 部署完得到網址，例如 `https://classroom-pet.pages.dev`

- [ ] **Step 15.3: 生 QR Code**

```bash
python -c "
import qrcode
img = qrcode.make('https://classroom-pet.pages.dev')
img.save('D:/CCdesk/Projects/classroom-pet/assets/qrcode.png')
print('qr saved')
"
```

- [ ] **Step 15.4: 最終 commit + push**

```bash
git add assets/qrcode.png
git commit -m "docs: add QR code for distribution"
git push
```

- [ ] **Step 15.5: 實地測試**

在一台教室筆電打開部署的網址，完成 Task 14 的手動驗收 checklist。測試完成後，Phase 1 MVP 完成。

---

## 完工檢查

**完成 Phase 1 MVP 的定義：**

- [ ] 所有 Task 1-15 完成
- [ ] 單元測試 全部 pass
- [ ] Task 14 手動驗收 checklist 全部 pass
- [ ] 部署網址可訪問、可安裝 PWA
- [ ] 賢哥在至少 1 個真實教室場景試用並提供回饋

---

## 後續（Phase 2、3）

- **Phase 2 抽卡**：另開 `docs/plan-phase2-gacha.md`
- **Phase 3 錦上添花**：另開 `docs/plan-phase3-polish.md`
- **美術升級**：另開 `docs/plan-art-upgrade.md`（用 nanobanana skill 生 AI 圖）

---

## 決策參考（若過程中想不起來為何這樣做）

詳見 `docs/design.md` 的 §10 風險與考量、§9.3 明確不做、附錄 ADR 四則。
