/* When any precached file changes, bump VERSION. */
"use strict";

const VERSION = "renaissance-v1";
const CACHE = VERSION;
const NET_MS = 3000;

const PRECACHE = [
  "./",
  "index.html",
  "styles.css",
  "content.js",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "assets/credits.json",
  "assets/map/italy-relief.jpg",
  "assets/art/birth-of-venus.jpg",
  "assets/art/creation-of-adam.jpg",
  "assets/art/david.jpg",
  "assets/art/davinci-flying-machine.jpg",
  "assets/art/florence-duomo.jpg",
  "assets/art/last-supper.jpg",
  "assets/art/medieval-madonna.jpg",
  "assets/art/mona-lisa.jpg",
  "assets/art/pieta.jpg",
  "assets/art/school-of-athens.jpg",
  "assets/art/sistine-ceiling.jpg",
  "assets/art/st-peters.jpg",
  "assets/art/titian-assumption.jpg",
  "assets/art/titian-bacchus-ariadne.jpg",
  "assets/art/venice-grand-canal.jpg",
  "assets/art/vitruvian-man.jpg",
];

function navigationResponse(request) {
  const fromNet = fetch(request).catch(() => null);
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), NET_MS);
  });
  return Promise.race([fromNet, timeout]).then((winner) => {
    if (winner) return winner;
    return caches.match("index.html", { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fromNet.then((response) => response || Response.error());
    });
  });
}

function networkFirst(request) {
  const fromNet = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), NET_MS);
  });
  return Promise.race([fromNet, timeout]).then((winner) => {
    if (winner && winner.ok) return winner;
    return caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fromNet.then((response) => response || Response.error());
    });
  });
}

function staleWhileRevalidate(event, request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const refresh = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            return cache
              .put(request, response.clone())
              .then(() => response)
              .catch(() => response);
          }
          return response;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(refresh.then(() => undefined));
        return cached;
      }
      return refresh.then((response) => response || Response.error());
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((path) => new Request(path, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((name) => name.startsWith("renaissance-") && name !== CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }
  event.respondWith(networkFirst(request));
});
