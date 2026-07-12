// Service Worker dedicato alle notifiche push di AuraTV. Gira in background,
// indipendentemente dal fatto che l'app sia aperta o chiusa — è questo che
// rende possibile ricevere una notifica anche ad app chiusa.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: 'AuraTV', body: event.data.text() };
  }

  const title = payload.title || 'AuraTV';
  const options = {
    body: payload.body || '',
    icon: payload.icon || './icon-192.png',
    badge: './icon-192.png',
    data: { url: payload.url || './' },
    tag: payload.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
