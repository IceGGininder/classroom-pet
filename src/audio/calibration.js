// src/audio/calibration.js
// 10 秒校準流程。返回平均 dB 作為基線，存入 settings.calibration.baselineDb。

export async function calibrate(detector, durationSec = 10, onProgress = () => {}) {
  if (!detector.isRunning()) {
    await detector.start();
  }
  const samples = [];
  return new Promise(resolve => {
    let elapsed = 0;
    const interval = setInterval(() => {
      const db = detector.getCurrentDb();
      if (db != null) samples.push(db);
      elapsed += 1;
      onProgress({ elapsed, total: durationSec });
      if (elapsed >= durationSec) {
        clearInterval(interval);
        if (samples.length === 0) {
          resolve(-50); // fallback 預設值
          return;
        }
        const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
        resolve(avg);
      }
    }, 1000);
  });
}
