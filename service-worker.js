const STATIC_CACHE = "garden-survivor-static-v4";
const RUNTIME_CACHE = "garden-survivor-runtime-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./favicon.ico",
  "./manifest.webmanifest",
  "./styles/app.css",
  "./src/main.js",
  "./src/audio.js",
  "./src/data.js",
  "./src/game.js",
  "./src/garden-data.js",
  "./src/pixi-renderer.js",
  "./src/skills.js",
  "./src/storage.js",
  // Pixi 已改为本地依赖（importmap 指向 ./src/pixi-legacy.mjs），
  // 必须进入预缓存，否则离线启动时渲染层会加载失败。
  "./src/pixi-legacy.mjs",
  "./assets/pwa/icon-192.svg",
  "./assets/pwa/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isCacheableRequest(request) {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);
  return url.protocol === "http:" || url.protocol === "https:";
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableRequest(request)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
