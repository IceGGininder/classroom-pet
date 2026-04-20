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
