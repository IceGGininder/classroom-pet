// src/state/petState.js
// 寵物階段邏輯：依經驗值換算階段、進度。

export const STAGES = ['egg', 'newborn', 'young', 'growth', 'advanced', 'final'];

export function getStageFromExp(exp, thresholds) {
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
