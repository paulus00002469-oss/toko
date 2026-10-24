/* Service worker Apotek JOJO SATU — menyimpan tampilan aplikasi agar cepat dibuka */
var VERSION = 'jojo-v1';
var SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                   // API (POST) selalu langsung ke server
  if (/script\.google(usercontent)?\.com/.test(url.hostname)) return;  // data server tidak di-cache
  var sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && (req.mode === 'navigate' || /\/(index\.html|config\.js)?$/.test(url.pathname) || url.pathname.endsWith('config.js'))) {
    // halaman & pengaturan: ambil versi terbaru dulu, pakai cache bila offline
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('./index.html'); }); }));
    return;
  }
  if (sameOrigin || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.hostname)) {
    // ikon, font, library: pakai cache, perbarui di belakang layar
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
