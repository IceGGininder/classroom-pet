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
  it('450 exp 在 newborn 階段 → 下一階段 young(800)，進度 30%', () => {
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
