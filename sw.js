// Hükümdar servis çalışanı: sayfa her açılışta önce internetten tazesini ister (güncellemeler hemen gelir),
// internet yoksa son indirilen sürümle açılır.
const CACHE = 'hukumdar-v3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
const keep = (key, res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(key, c)); } return res; };
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  if (req.mode === 'navigate') {
    // sayfa: her zaman internetten taze; adres eklerinden (?t=…) bağımsız tek kopya saklanır
    const key = self.registration.scope;
    e.respondWith(fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then((res) => keep(key, res)).catch(() => caches.match(key).then((hit) => hit || fetch(req))));
    return;
  }
  if (/\/assets\/index-[\w-]+\.(js|css)$/.test(req.url)) {
    // adı içeriğe göre değişen dosyalar: önbellekte varsa oradan
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))));
    return;
  }
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then((res) => keep(req, res)).catch(() => caches.match(req).then((hit) => hit || Response.error())));
});
