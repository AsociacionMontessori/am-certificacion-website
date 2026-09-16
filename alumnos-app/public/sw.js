/* Only the public offline page is cached. Never cache student records or APIs. */
const CACHE = 'alumnos-public-offline-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add('/offline.html')));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('alumnos-public-offline-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE);
    return await cache.match('/offline.html') || new Response('Sin conexión. Vuelve a intentarlo cuando tengas internet.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }));
});
