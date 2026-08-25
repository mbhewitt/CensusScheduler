// Minimal service worker. Its only job is to exist with a fetch handler so
// browsers (Chrome/Android) treat the app as installable. It does NOT cache or
// rewrite anything — an empty fetch handler lets the network handle every
// request unchanged. peers is cloud-only this year, so we deliberately do NOT
// cache: a stale cached page on a tablet would be worse than a network hiccup.
// Add a cache-first handler here only if we ever want true offline page loads.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
