const CACHE_NAME = 'padang-limau-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/privasi.html',
    '/manifest.json',
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    if (STATIC_ASSETS.includes(event.request.url)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request);
            })
        );
        return;
    }

    // Dynamic content - Network first, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(cached => {
                    return cached || caches.match('/index.html');
                });
            })
    );
});

// Push Notification
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {
        title: 'Padang Limau Negeri Indah',
        body: 'Ada promo wisata terbaru! Cek sekarang 🌴',
        icon: '/icons/icon-192.png'
    };

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        image: data.image,
        data: { url: data.url || '/' },
        actions: [
            { action: 'open', title: 'Buka Aplikasi' },
            { action: 'close', title: 'Tutup' }
        ],
        tag: 'padang-limau-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});