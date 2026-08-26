const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `rapor-sine-${CACHE_VERSION}`;

const STATIC_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/config.js',
  '/js/utils/helpers.js',
  '/js/pages/login.js',
  '/js/pages/dashboard.js',
  '/js/pages/schools.js',
  '/js/pages/students.js',
  '/js/pages/reports.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

const API_CACHE = 'api-cache-v1';

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => {
          return name !== CACHE_NAME && name !== API_CACHE;
        }).map(name => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // API requests - Network First
  if (url.pathname.includes('/exec') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - Cache First
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then(response => {
            // Cache new static assets
            if (response.ok && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, clone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});
