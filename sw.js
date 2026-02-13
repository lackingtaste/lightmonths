// Lightmonths - Service Worker
const CACHE_NAME = 'lightmonths-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/Cesium.js',
  'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/Widgets/widgets.css'
];

// Install - cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Lightmonths: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Lightmonths: Cache failed', err))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Lightmonths: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Google Maps API (needs to be fresh)
  if (event.request.url.includes('tile.googleapis.com')) return;

  // Skip Cesium Ion requests (needs auth)
  if (event.request.url.includes('cesium.com') && event.request.url.includes('ion')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
