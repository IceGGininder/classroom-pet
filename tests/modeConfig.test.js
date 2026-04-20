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
    expect(t).toEqual([-49, -46, -42]);
  });
});
