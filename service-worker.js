const CACHE = "monthly-calendar-v12";
const APP_SHELL = ["./", "./index.html", "./style.css", "./app.js", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let isSameOrigin = false;
  try { isSameOrigin = new URL(request.url).origin === self.location.origin; } catch {}

  if (isSameOrigin) {
    // Cache-first: טוען מהמכשיר מיד, מרענן cache ברקע
    const cacheMatch = caches.match(request);
    event.respondWith(
      cacheMatch.then((cached) => {
        const networkFetch = fetch(request).then((res) => {
          event.waitUntil(caches.open(CACHE).then((c) => c.put(request, res.clone())));
          return res;
        }).catch(() => Response.error());
        return cached || networkFetch;
      })
    );
  } else {
    // Cache-first לספריות CDN
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }).catch(() => Response.error());
      })
    );
  }
});
