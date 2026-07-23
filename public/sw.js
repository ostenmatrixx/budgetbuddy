const CACHE_PREFIX = "budgetbuddy-static-";
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const LEGACY_CACHE_NAMES = ["budgetbuddy-app-shell-v1"];
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/legal.css",
  "/privacy.html",
  "/terms.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

const STATIC_ASSET_PATTERN =
  /^\/assets\/[^/?]+-[a-zA-Z0-9_-]+\.(?:css|js|woff2?|png|jpe?g|svg|webp|avif)$/;

function isSafeStaticPath(pathname) {
  return APP_SHELL.includes(pathname) || STATIC_ASSET_PATTERN.test(pathname);
}

function isCacheableStaticRequest(request, url) {
  return (
    url.origin === self.location.origin &&
    isSafeStaticPath(url.pathname) &&
    ["font", "image", "script", "style"].includes(request.destination)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      if (!self.registration.active) {
        await cache.addAll(APP_SHELL);
        return;
      }

      const cacheNames = await caches.keys();
      const previousCacheNames = cacheNames.filter(
        (cacheName) =>
          cacheName !== CACHE_NAME &&
          (cacheName.startsWith(CACHE_PREFIX) || LEGACY_CACHE_NAMES.includes(cacheName))
      );

      for (const previousCacheName of previousCacheNames) {
        const previousCache = await caches.open(previousCacheName);
        const cachedRequests = await previousCache.keys();

        for (const cachedRequest of cachedRequests) {
          const cachedUrl = new URL(cachedRequest.url);
          if (cachedUrl.origin !== self.location.origin || !isSafeStaticPath(cachedUrl.pathname)) {
            continue;
          }

          const cachedResponse = await previousCache.match(cachedRequest);
          if (cachedResponse) {
            await cache.put(cachedRequest, cachedResponse);
          }
        }
      }

      await cache.addAll(APP_SHELL.filter((path) => path !== "/" && path !== "/index.html"));
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName !== CACHE_NAME &&
                (cacheName.startsWith(CACHE_PREFIX) || LEGACY_CACHE_NAMES.includes(cacheName))
            )
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", responseClone))
            );
          }

          return response;
        })
        .catch(async () => {
          const appShell = await caches.match("/index.html");
          return appShell || caches.match("/offline.html");
        })
    );
    return;
  }

  if (!isCacheableStaticRequest(request, requestUrl)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        const responseClone = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone)));
      }

      return response;
    })
  );
});
