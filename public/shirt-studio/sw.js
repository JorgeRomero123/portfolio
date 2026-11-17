// Offline shell. Bump VERSION whenever any file changes.
const VERSION = 'ss-v2';
const FILES = [
  'index.html', 'styles.css', 'manifest.webmanifest',
  'js/app.js', 'js/ui.js', 'js/editor.js', 'js/doc.js', 'js/render.js', 'js/brushes.js',
  'js/png.js', 'js/db.js', 'js/util.js', 'js/color.js', 'js/mockup.js',
  'fonts/Anton.woff2', 'fonts/BebasNeue.woff2', 'fonts/ArchivoBlack.woff2',
  'fonts/PermanentMarker.woff2', 'fonts/Pacifico.woff2', 'fonts/SpaceMono.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
// Network first so updates land right away; cache when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        // Only cache real files, never the password screen or an error.
        if (r.ok && !r.redirected) {
          const copy = r.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
