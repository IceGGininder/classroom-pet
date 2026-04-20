// service-worker.js
// 簡單的 cache-first service worker，讓課堂電子寵物可離線運作。

const CACHE = 'classroom-pet-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/main.js',
  './src/audio/volumeDetector.js',
  './src/audio/calibration.js',
  './src/state/storage.js',
  './src/state/moodEngine.js',
  './src/state/petState.js',
  './src/state/skillSystem.js',
  './src/state/modeConfig.js',
  './src/state/exportImport.js',
  './src/ui/petDisplay.js',
  './src/ui/controls.js',
  './src/ui/settings.js',
  './src/ui/notifications.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // 只快取同源資源；CDN 的 Alpine/Tailwind 仍走網路
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return resp;
    }))
  );
});
