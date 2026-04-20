// src/state/moodEngine.js
// 心情值引擎（純函式工廠）。三層防抖：
//   1. 滯後閾值（hysteresis）：進入用硬閾值，計時觸發用軟閾值
//      calm→happy 以 happy.exit(77) 作為開始計時點
//      happy→calm 以 happy.enter(83) 作為開始計時點（回落時敏感度較低）
//      其他狀態依此類推
//   2. 不對稱連續秒數：退 10 秒、升 6 秒
//      （含初始 mood 在候選區的預熱計 1 秒，有效感知約 5 秒）
//   3. 狀態機：以當前 visualState 為基準判讀目標狀態
//      向更好方向進行時，若收到 loud/veryLoud 判決則重置計時器
// verdict: 'quiet' | 'acceptable' | 'loud' | 'veryLoud'
// mode: 'focus' | 'discuss' | 'free' | 'paused'
// visualState: 'happy' | 'calm' | 'worried' | 'scared'

const MOOD_DELTA = {
  focus:   { quiet: +0.3, acceptable: 0, loud: -0.5, veryLoud: -1.5 },
  discuss: { quiet: +0.3, acceptable: 0, loud: -0.2, veryLoud: -0.6 },
  free:    { quiet: 0,    acceptable: 0, loud: 0,    veryLoud: 0 },
  paused:  { quiet: 0,    acceptable: 0, loud: 0,    veryLoud: 0 },
};

const STATE_THRESHOLDS = {
  happy:    { enter: 83, exit: 77 },
  worried:  { enter: 47, exit: 53 },
  scared:   { enter: 17, exit: 23 },
};

const HYSTERESIS_SECONDS = {
  toHappier: 6,   // includes 1-second constructor pre-warm, effective ~5s
  toSadder:  10,
};

const SADNESS_ORDER = { happy: 0, calm: 1, worried: 2, scared: 3 };

export function createMoodEngine(options = {}) {
  let mood = options.initialMood ?? 60;
  let visualState = options.initialState ?? 'calm';
  let sessionExp = 0;

  // Determine candidate state using soft thresholds:
  //   exiting a state uses the ENTER threshold of the current state (softer edge),
  //   so the debounce window starts before fully crossing into the hard zone.
  function determineCandidateState(m) {
    if (visualState === 'scared') {
      // Recovery direction: use scared.enter (17) as soft trigger
      return m >= STATE_THRESHOLDS.scared.enter ? 'worried' : 'scared';
    }
    if (visualState === 'worried') {
      // Worsening: use scared.exit (23) as soft trigger
      if (m <= STATE_THRESHOLDS.scared.exit) return 'scared';
      // Recovery: use worried.enter (47) as soft trigger
      if (m >= STATE_THRESHOLDS.worried.enter) return 'calm';
      return 'worried';
    }
    if (visualState === 'calm') {
      // Worsening: use worried.exit (53) as soft trigger
      if (m <= STATE_THRESHOLDS.worried.exit) return 'worried';
      // Recovery: use happy.exit (77) as soft trigger
      if (m >= STATE_THRESHOLDS.happy.exit) return 'happy';
      return 'calm';
    }
    if (visualState === 'happy') {
      // Worsening: use happy.enter (83) as soft trigger
      return m < STATE_THRESHOLDS.happy.enter ? 'calm' : 'happy';
    }
    return visualState;
  }

  function requiredSeconds(from, to) {
    return SADNESS_ORDER[to] > SADNESS_ORDER[from]
      ? HYSTERESIS_SECONDS.toSadder
      : HYSTERESIS_SECONDS.toHappier;
  }

  // Pre-warm: if initialMood is already in a candidate zone, seed counter at 1
  let candidateState = determineCandidateState(mood);
  let candidateSeconds = candidateState !== visualState ? 1 : 0;

  function tick(verdict, mode) {
    const delta = (MOOD_DELTA[mode] ?? MOOD_DELTA.paused)[verdict] ?? 0;
    mood = Math.max(0, Math.min(100, mood + delta));

    if ((mode === 'focus' || mode === 'discuss') && verdict === 'quiet') {
      sessionExp += 1;
    }

    // When recovering (heading toward a happier state), any loud/veryLoud resets the counter.
    // This prevents a brief quiet streak from committing a positive visual change
    // when noise spikes mid-transition.
    const isGoingHappier =
      candidateState !== visualState &&
      SADNESS_ORDER[candidateState] < SADNESS_ORDER[visualState];
    if (isGoingHappier && (verdict === 'loud' || verdict === 'veryLoud')) {
      candidateState = visualState;
      candidateSeconds = 0;
      return;
    }

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

  function consumeSessionExp() {
    const v = sessionExp;
    sessionExp = 0;
    return v;
  }

  return {
    tick,
    resetSession,
    consumeSessionExp,
    getMood: () => mood,
    getVisualState: () => visualState,
    getSessionExp: () => sessionExp,
    getCandidateState: () => candidateState,
    getCandidateSeconds: () => candidateSeconds,
  };
}
