/**
 * Service Worker - Padang Limau Negeri Indah
 * Mode: Display Only (No Data Collection)
 * Scope: /PD_LIMAU/
 */

const CACHE_NAME = 'padang-limau-v1';
const STATIC_CACHE = 'static-v1';

// Assets yang akan di-cache untuk offline access
const STATIC_ASSETS = [
  '/PD_LIMAU/',
  '/PD_LIMAU/index.html',
  '/PD_LIMAU/privasi.html',
  '/PD_LIMAU/manifest.json',
  '/PD_LIMAU/sw.js',
  '/PD_LIMAU/icons/icon-72.png',
  '/PD_LIMAU/icons/icon-96.png',
  '/PD_LIMAU/icons/icon-128.png',
  '/PD_LIMAU/icons/icon-144.png',
  '/PD_LIMAU/icons/icon-152.png',
  '/PD_LIMAU/icons/icon-192.png',
  '/PD_LIMAU/icons/icon-384.png',
  '/PD_LIMAU/icons/icon-512.png',
  '/PD_LIMAU/offline.html'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install error:', err))
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache First strategy untuk display-only
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Hanya handle GET requests
  if (request.method !== 'GET') return;

  // Skip external resources (CDN fonts, images, etc.)
  const url = new URL(request.url);
  if (url.origin !== location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-First strategy untuk assets lokal
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      
      return fetch(request).then((response) => {
        // Clone response untuk cache
        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      }).catch(() => {
        // Fallback ke offline.html untuk navigasi
        if (request.mode === 'navigate') {
          return caches.match('/PD_LIMAU/offline.html');
        }
        return new Response('Offline - Konten tidak tersedia', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Skip push notification handling (no data collection mode)
// Jika ingin notifikasi, tambahkan event listener terpisah

console.log('[SW] Service Worker loaded - Display Only Mode');