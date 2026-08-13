// FleetMaster Pro - minimal service worker
//
// Goal: make the app installable ("Add to Home Screen" / desktop install)
// on any device, with a very small offline fallback for the app shell.
//
// Deliberately does NOT cache API responses (http://localhost:5000/api/*)
// - all fleet data always comes straight from the network so every device
// sees the latest information. Only the static app shell (HTML/icons) gets
// a light cache, purely so re-opening the installed app while offline
// doesn't show a browser error page.

const CACHE_NAME = "fleetmaster-shell-v1";
const SHELL_URLS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept API calls or non-GET requests - always go live.
  if (request.method !== "GET" || request.url.includes("/api/")) {
    return;
  }

  // Only handle page navigations specially; let all other same-origin
  // GETs (JS/CSS bundles, images) pass straight through to the network.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
  }
});
