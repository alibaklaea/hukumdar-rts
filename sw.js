// Hükümdar servis çalışanı: sayfa her açılışta önce internetten tazesini ister (güncellemeler hemen gelir),
// internet yoksa son indirilen sürümle açılır.
const CACHE = 'hukumdar-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const hashed = /\/assets\/index-[\w-]+\.(js|css)$/.test(req.url);
  if (hashed) {
    // adı içeriğe göre değişen dosyalar: önbellekte varsa oradan
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); return res; })));
    return;
  }
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); } return res; })
      .catch(() => caches.match(req).then((hit) => hit || Response.error())),
  );
});
