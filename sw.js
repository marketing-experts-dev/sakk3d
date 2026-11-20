/* Sakk 3D – offline gyorsítótár.
   Ez a fájl a v24 óta VÁLTOZATLAN marad: új verziónál elég az index.html-t feltölteni.
   Az oldalt online állapotban mindig frissen kéri (a böngésző gyorsítótárát is megkerülve),
   offline a tárolt példányt adja. A ritkán változó fájlok (3D motor, ikonok) a tárolóból jönnek,
   közben a háttérben frissülnek. */
const CACHE = 'sakk3d-stable';
const CORE = ['./', './index.html', './three.min.js', './peerjs.min.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // az oldal maga: mindig a hálózatról, újraellenőrizve; hiba (offline) esetén a tárolt példány
  if (req.mode === 'navigate' || (url.origin === location.origin && (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')))) {
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // minden más (3D motor, ikonok, betűtípusok): előbb a tároló, közben háttérfrissítés
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
