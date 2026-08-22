// Minimal service worker. Its only job is to exist with a fetch handler so
// browsers (Chrome/Android) treat the app as installable. It does NOT cache or
// rewrite anything — an empty fetch handler lets the network handle every
// request unchanged, which keeps the on-playa nginx/dnsmasq offline network
// behaving exactly as before. ponytail: no caching; add a cache-first handler
// here only if we actually want offline page loads.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
