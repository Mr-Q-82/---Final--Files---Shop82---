const CACHE = "shop82-v110-admin-root-search-fix-138";
const RUNTIME_CACHE = `${CACHE}-runtime`;
const MAX_RUNTIME_ENTRIES = 80;
const ASSETS = [
  "/html/index.html",
  "/html/admin.html",
  "/dist/storefront.bundle.js?v=138",
  "/dist/storefront.bundle.css?v=138",
  "/dist/admin.bundle.js?v=18",
  "/public/manifest.webmanifest",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![CACHE, RUNTIME_CACHE, "shop82-catalog-api-v2"].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);

const trimRuntimeCache = async () => {
  const cache = await caches.open(RUNTIME_CACHE);
  const requests = await cache.keys();
  await Promise.all(requests.slice(0, Math.max(0, requests.length - MAX_RUNTIME_ENTRIES)).map((request) => cache.delete(request)));
};

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_RUNTIME") event.waitUntil(caches.delete(RUNTIME_CACHE));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  if (event.request.mode === "navigate") {
    const fallback = new URL(event.request.url).pathname.startsWith("/admin")
      ? "/html/admin.html"
      : "/html/index.html";
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          caches.open(CACHE).then((cache) => cache.put(fallback, response.clone()));
          return response;
        })
        .catch(() => caches.match(fallback)),
    );
    return;
  }
  if (new URL(event.request.url).pathname.startsWith("/dist/")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic") {
          cache.put(event.request, response.clone()).then(trimRuntimeCache);
        }
        return response;
      });
      return cached || network;
    }),
  );
});
