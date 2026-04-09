self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open("monthly-calendar-v1");
      await cache.addAll(["./", "./index.html", "./style.css", "./app.js", "./manifest.json"]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== "monthly-calendar-v1").map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        // Cache same-origin requests (CDN is optional)
        if (new URL(request.url).origin === self.location.origin) {
          const cache = await caches.open("monthly-calendar-v1");
          cache.put(request, res.clone());
        }
        return res;
      } catch (e) {
        // Offline fallback: try index
        return (await caches.match("./index.html")) || Response.error();
      }
    })()
  );
});
