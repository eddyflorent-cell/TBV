/* TBV PWA Service Worker */

const CACHE_NAME = "tbv-v4-pwa-4";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // cache same-origin basic responses
          try {
            const url = new URL(req.url);
            if (
              url.origin === self.location.origin &&
              res &&
              res.status === 200 &&
              res.type === "basic"
            ) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(req, copy)
              );
            }
          } catch (e) {
            // ignore
          }
          return res;
        })
        .catch(() => {
          // fallback offline
          if (cached) return cached;
          return caches.match("./index.html");
        });
    })
  );
});
