// src/state/exportImport.js
// JSON 匯出/匯入工具。提供手動備份與換機還原。

import { loadState, STORAGE_KEY } from './storage.js';

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
  if (!parsed.version || !parsed.pet) {
    throw new Error('不是合法的備份檔（缺 version 或 pet 欄位）');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}
