// File: service-worker.js (letakkan di root)

// Push event: tampilkan notifikasi
self.addEventListener('push', function(event) {
  let data = { title: 'Notifikasi Baru', body: 'Periksa aplikasi Anda.', url: '/' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // Jika payload bukan JSON, interpret sebagai text
    try {
      data.body = event.data.text();
    } catch (e2) {}
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: (data.data && data.data.url) ? data.data.url : (data.url || '/')
    }
    // Note: property 'sound' tidak didukung di web notifications; hapus atau biarkan fallback
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notifikasi', options)
  );
});

// Notification click: buka/fokus tab ke URL yang diberikan
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Coba fokus tab yang sudah terbuka dengan URL sama
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // Gunakan startsWith agar query string tidak memblokir
        if (client.url && client.url.indexOf(targetUrl) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Optional: cleanup on activate (nothing special needed here)
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
