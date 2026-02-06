/* SimpleDrive PWA Service Worker */
const CACHE_NAME = "simpledrive-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// instala e cacheia o básico
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// estratégia: navegação = network-first (pra não quebrar Firebase), assets = cache-first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só controla o mesmo domínio
  if (url.origin !== location.origin) return;

  // HTML navegação
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("./", copy));
        return res;
      }).catch(() => caches.match("./"))
    );
    return;
  }

  // arquivos estáticos do app
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
