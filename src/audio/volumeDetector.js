// src/audio/volumeDetector.js
// Web Audio API 封裝。提供 start / stop / getCurrentDb / getInstantRms。
// 採 RMS 計算瞬時音量、3 秒 moving average 平滑化避免尖峰誤觸發。

const BUFFER_SAMPLES = 1024;
const SMOOTH_SECONDS = 3;
const TICKS_PER_SECOND = 10; // 100ms 一次採樣

export function createVolumeDetector() {
  let audioCtx = null;
  let sourceNode = null;
  let analyser = null;
  let mediaStream = null;
  let intervalId = null;
  const buffer = new Float32Array(BUFFER_SAMPLES);
  const smoothBuffer = []; // 最近 SMOOTH_SECONDS * TICKS_PER_SECOND 筆
  let currentDb = null;
  let isRunningFlag = false;

  async function start() {
    if (isRunningFlag) return;
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaStreamSource(mediaStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = BUFFER_SAMPLES * 2;
    sourceNode.connect(analyser);

    intervalId = setInterval(sampleTick, 1000 / TICKS_PER_SECOND);
    isRunningFlag = true;
  }

  function sampleTick() {
    if (!analyser) return;
    analyser.getFloatTimeDomainData(buffer);
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
    const rms = Math.sqrt(sumSq / buffer.length);
    // 轉 dB（相對 1.0），靜音時給 -120
    const db = rms > 0 ? 20 * Math.log10(rms) : -120;

    smoothBuffer.push(db);
    const maxLen = SMOOTH_SECONDS * TICKS_PER_SECOND;
    if (smoothBuffer.length > maxLen) smoothBuffer.shift();
    const avg = smoothBuffer.reduce((s, v) => s + v, 0) / smoothBuffer.length;
    currentDb = avg;
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    if (audioCtx) audioCtx.close();
    audioCtx = null;
    sourceNode = null;
    analyser = null;
    mediaStream = null;
    smoothBuffer.length = 0;
    currentDb = null;
    isRunningFlag = false;
  }

  return {
    start,
    stop,
    getCurrentDb: () => currentDb,
    getInstantRms: () => (smoothBuffer.length > 0 ? smoothBuffer[smoothBuffer.length - 1] : null),
    isRunning: () => isRunningFlag,
  };
}
