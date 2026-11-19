// كاش بسيط عشان الموقع يفتح بسرعة ويشتغل حتى لو النت ضعيف
const C = 'ruh-v1';
const CORE = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/plan.js', 'js/data.js', 'js/firebase-config.js', 'js/ui.js', 'js/stats.js', 'js/features.js', 'js/journey.js', 'js/admin.js', 'js/ship.js', 'data/genesis.json',
  'assets/fonts/reem-kufi-arabic-700-normal.woff2', 'assets/fonts/reem-kufi-arabic-500-normal.woff2', 'assets/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2', 'assets/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2',
  'assets/fonts/noto-naskh-arabic-arabic-400-normal.woff2', 'assets/fonts/aref-ruqaa-arabic-400-normal.woff2', 'assets/img/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
