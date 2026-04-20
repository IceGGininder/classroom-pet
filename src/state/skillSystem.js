// src/state/skillSystem.js
// 技能解鎖邏輯。MVP 只有 N 級；R/SR/SSR 抽卡留給 Phase 2。

export const N_SKILLS = [
  { id: 'egg_wiggle', stage: 'egg',      name: '蛋搖晃',   rarity: 'N' },
  { id: 'spin',       stage: 'newborn',  name: '轉圈',     rarity: 'N' },
  { id: 'bubbles',    stage: 'young',    name: '彩色泡泡', rarity: 'N' },
  { id: 'magic_hat',  stage: 'growth',   name: '魔法帽',   rarity: 'N' },
  { id: 'wings',      stage: 'advanced', name: '小翅膀',   rarity: 'N' },
  { id: 'singing',    stage: 'final',    name: '唱歌',     rarity: 'N' },
];

export function unlockForStage(stage, alreadyUnlocked) {
  const skill = N_SKILLS.find(s => s.stage === stage);
  if (!skill) return null;
  if (alreadyUnlocked.some(u => u.id === skill.id)) return null;
  return skill;
}
