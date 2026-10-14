/* טהרת אסתר - וסתות | (C) 2026 yhg | כל הזכויות שמורות | ראה קובץ LICENSE */
const CACHE = "monthly-calendar-v19";
const APP_SHELL = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.json",
  "./madrich.html", "./faq.html", "./privacy.html",
  "./icon.svg", "./icon-192.png",
  "./תמונות/lilac-gold.webp", "./תמונות/rose-ivory.webp",
  "./תמונות/sage-cream.webp", "./תמונות/turquoise-pearl.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL))
  );
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
  // סרטונים — ישירות מהרשת, בלי מטמון (קבצים גדולים ובקשות טווח)
  if (/\.(mp4|webm)(\?|$)/i.test(request.url)) return;

  let isSameOrigin = false;
  try { isSameOrigin = new URL(request.url).origin === self.location.origin; } catch {}

  if (isSameOrigin) {
    // Cache-first: טוען מהמכשיר מיד, מרענן cache ברקע.
    // waitUntil נקרא מיד (לא מתוך then מאוחר) כדי שהרענון יושלם גם כשהתשובה הגיעה מהמטמון.
    let cachePut = Promise.resolve();
    const networkFetch = fetch(request).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        cachePut = caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    });
    event.waitUntil(networkFetch.then(() => cachePut).catch(() => {}));
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || networkFetch)
        .catch(() => Response.error())
    );
  } else {
    // Cache-first לספריות CDN. תגובות opaque (תגית script בלי CORS) תקינות ונשמרות.
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }).catch(() => Response.error());
      })
    );
  }
});
