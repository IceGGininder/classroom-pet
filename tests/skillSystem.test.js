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
