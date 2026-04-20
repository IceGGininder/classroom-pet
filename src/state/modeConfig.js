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
  if (db == null || baselineDb == null) return 'quiet'; // 偵測不到 = 安靜（設計哲學）
  const [low, mid, high] = computeThresholds(baselineDb, mode, adjustment);
  if (db < low) return 'quiet';
  if (db < mid) return 'acceptable';
  if (db < high) return 'loud';
  return 'veryLoud';
}
