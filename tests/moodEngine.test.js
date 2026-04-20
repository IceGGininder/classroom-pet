import { describe, it, expect } from 'vitest';
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
    for (let i = 0; i < 4; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('calm');
    expect(eng.getMood()).toBeCloseTo(83.2, 1);
    for (let i = 0; i < 1; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('happy');
  });

  it('從 happy 退到 calm 需連續 10 秒心情 < 77', () => {
    const eng = createMoodEngine({ initialMood: 85, initialState: 'happy' });
    for (let i = 0; i < 9; i++) eng.tick('loud', 'focus');
    expect(eng.getMood()).toBeCloseTo(80.5, 1);
    expect(eng.getVisualState()).toBe('happy');
    for (let i = 0; i < 10; i++) eng.tick('loud', 'focus');
    expect(eng.getVisualState()).toBe('calm');
  });

  it('短暫尖峰（3 秒 veryLoud）不會觸發狀態切換', () => {
    const eng = createMoodEngine({ initialMood: 70, initialState: 'calm' });
    for (let i = 0; i < 3; i++) eng.tick('veryLoud', 'focus');
    expect(eng.getVisualState()).toBe('calm');
  });

  it('害怕狀態恢復到擔心僅需 5 秒安靜（含滯後）', () => {
    const eng = createMoodEngine({ initialMood: 15, initialState: 'scared' });
    for (let i = 0; i < 5; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('scared');
    for (let i = 0; i < 25; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('worried');
  });

  it('連續秒數計時器會在心情值跨回閾值時重置', () => {
    const eng = createMoodEngine({ initialMood: 82, initialState: 'calm' });
    for (let i = 0; i < 3; i++) eng.tick('quiet', 'focus');
    eng.tick('loud', 'focus');
    for (let i = 0; i < 5; i++) eng.tick('quiet', 'focus');
    expect(eng.getVisualState()).toBe('calm');
  });
});

describe('MoodEngine - 模式倍率差異', () => {
  it('討論模式下偏吵的扣分較小 (-0.2)', () => {
    const eng = createMoodEngine({ initialMood: 70 });
    for (let i = 0; i < 10; i++) eng.tick('loud', 'discuss');
    expect(eng.getMood()).toBeCloseTo(68, 1);
  });
});

describe('MoodEngine - 經驗值累積', () => {
  it('每次安靜 tick 在 focus/discuss 累積經驗值', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 100; i++) eng.tick('quiet', 'focus');
    expect(eng.getSessionExp()).toBe(100);
  });

  it('自由模式不累積經驗值', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 100; i++) eng.tick('quiet', 'free');
    expect(eng.getSessionExp()).toBe(0);
  });

  it('resetSession 清除心情與 sessionExp', () => {
    const eng = createMoodEngine({ initialMood: 50 });
    for (let i = 0; i < 5; i++) eng.tick('veryLoud', 'focus');
    eng.resetSession();
    expect(eng.getMood()).toBe(60);
    expect(eng.getSessionExp()).toBe(0);
  });

  it('consumeSessionExp 回傳累積值並歸零', () => {
    const eng = createMoodEngine();
    for (let i = 0; i < 10; i++) eng.tick('quiet', 'focus');
    expect(eng.consumeSessionExp()).toBe(10);
    expect(eng.getSessionExp()).toBe(0);
  });
});
