/* Add new guides' files to PRECACHE. Bump VERSION when the list changes. */
"use strict";

const VERSION = "study-guides-v1";
const CACHE = VERSION;
const NET_MS = 3000;

const PRECACHE = [
  "./",
  "index.html",
  "offline.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "renaissance/",
  "renaissance/index.html",
  "renaissance/styles.css",
  "renaissance/content.js",
  "renaissance/app.js",
  "renaissance/assets/credits.json",
  "renaissance/assets/map/italy-relief.jpg",
  "renaissance/assets/art/birth-of-venus.jpg",
  "renaissance/assets/art/creation-of-adam.jpg",
  "renaissance/assets/art/david.jpg",
  "renaissance/assets/art/davinci-flying-machine.jpg",
  "renaissance/assets/art/florence-duomo.jpg",
  "renaissance/assets/art/last-supper.jpg",
  "renaissance/assets/art/medieval-madonna.jpg",
  "renaissance/assets/art/mona-lisa.jpg",
  "renaissance/assets/art/pieta.jpg",
  "renaissance/assets/art/school-of-athens.jpg",
  "renaissance/assets/art/sistine-ceiling.jpg",
  "renaissance/assets/art/st-peters.jpg",
  "renaissance/assets/art/titian-assumption.jpg",
  "renaissance/assets/art/titian-bacchus-ariadne.jpg",
  "renaissance/assets/art/venice-grand-canal.jpg",
  "renaissance/assets/art/vitruvian-man.jpg",
];

function storeBasic(request, response) {
  if (!response || !response.ok || response.type !== "basic" || response.redirected) return;
  const copy = response.clone();
  const key = request.mode === "navigate" ? new Request(request.url) : request;
  caches.open(CACHE).then((cache) => cache.put(key, copy)).catch(() => {});
}

function directoryIndexPath(urlString) {
  const url = new URL(urlString);
  const scopePath = new URL(self.registration.scope).pathname;
  const prefix = scopePath.endsWith("/") ? scopePath : scopePath + "/";
  let path = url.pathname;
  if (path + "/" === prefix) path = prefix;
  if (path !== prefix && !path.startsWith(prefix)) return "index.html";
  const rel = path.slice(prefix.length);
  if (!rel || rel.endsWith("/")) return rel + "index.html";
  const slash = rel.lastIndexOf("/");
  const dir = slash >= 0 ? rel.slice(0, slash + 1) : "";
  const base = slash >= 0 ? rel.slice(slash + 1) : rel;
  if (base.indexOf(".") >= 0) return dir + "index.html";
  return rel + "/index.html";
}

function matchNavigation(request) {
  return caches.match(request, { ignoreSearch: true }).then((hit) => {
    if (hit) return hit;
    const indexPath = directoryIndexPath(request.url);
    return caches.match(new Request(indexPath), { ignoreSearch: true }).then((indexed) => {
      if (indexed) return indexed;
      if (indexPath === "index.html") return undefined;
      return caches.match(new Request("index.html"), { ignoreSearch: true });
    });
  });
}

function navigationResponse(request) {
  const fromNet = fetch(request)
    .then((response) => {
      storeBasic(request, response);
      return response;
    })
    .catch(() => null);
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), NET_MS);
  });
  return Promise.race([fromNet, timeout]).then((winner) => {
    if (winner) return winner;
    return matchNavigation(request).then((cached) => {
      if (cached) return cached;
      return fromNet.then((response) => response || Response.error());
    });
  });
}

function networkFirst(request) {
  const fromNet = fetch(request)
    .then((response) => {
      storeBasic(request, response);
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
          if (response && response.ok && response.type === "basic" && !response.redirected) {
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

function refreshEntry(cache, path) {
  const request = new Request(path, { cache: "reload" });
  return fetch(request).then((response) => {
    if (!response || !response.ok || response.type !== "basic" || response.redirected) {
      throw new Error("refresh failed");
    }
    return cache.put(request, response);
  });
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
            .filter(
              (name) =>
                name !== CACHE &&
                (name.startsWith("study-guides-") || name.startsWith("renaissance-"))
            )
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

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "refresh") return;
  const port = event.ports && event.ports[0];
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((path) => refreshEntry(cache, path))))
      .then((results) => {
        let ok = 0;
        let failed = 0;
        results.forEach((result) => {
          if (result.status === "fulfilled") ok += 1;
          else failed += 1;
        });
        if (port) port.postMessage({ ok: ok, failed: failed });
      })
      .catch(() => {
        if (port) port.postMessage({ ok: 0, failed: PRECACHE.length });
      })
  );
});
