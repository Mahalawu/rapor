const CACHE_NAME = 'app-rapor-sdn-sine1-v2';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/auth.js',
  './js/config.js',
  './js/dashboard.js',
  './js/siswa.js',
  './js/tp.js',
  './js/nilai.js',
  './js/absensi.js',
  './js/kokurikuler.js',
  './js/rekap.js',
  './js/pengaturan.js',
  './manifest.json',
  './tutwuri.png'
  './logo.png'
];

// 1. Fase Install (Safe Caching: Jika ada 1 file missing, SW TIDAK AKAN CRASH)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        urlsToCache.map((url) => 
          cache.add(url).catch((err) => console.warn('Gagal cache file:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Fase Activate (Hapus Cache Versi Lama)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fase Fetch (Satu Pintu: Lewatkan Request API Google Script)
self.addEventListener('fetch', (event) => {
  // Abaikan request API Apps Script agar selalu tembus ke server
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
