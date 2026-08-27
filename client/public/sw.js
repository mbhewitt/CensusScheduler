// Service worker: transparent local cache for shift READS only.
//
// Why: the shifts data is small and fast to query on the server (~17ms) but the
// payload (~200KB) is re-fetched over high-latency playa internet on every load
// with no cache. This serves shift GETs from an on-device cache instantly and
// revalidates in the background (stale-while-revalidate), so reopening the PWA /
// refreshing feels instant. WRITES are never touched — check-in/add/remove go
// straight to the network (prod). Everything that isn't a shift-read GET passes
// straight through, so the on-playa nginx/dnsmasq offline network behaves
// exactly as before. Freshness: background revalidation on every fetch, plus the
// app's Socket.IO check-in broadcasts keep the live bits current.
// ponytail: scoped to the two shift-read endpoints; widen only if measured.

const SHIFTS_CACHE = "census-shifts-v2";

// Only the big agenda LIST is cached (that's the ~200KB slow payload):
//   GET /api/shifts   (the agenda; may carry ?filter=...)
// Deliberately NOT the per-shift roster (/api/shifts/<id>/volunteers): that page
// is interactive (check-in toggles), and caching it made check-ins appear to not
// update live as a re-read served a stale roster. Also NOT the admin
// sub-resources (/api/shifts/categories|positions|types) or per-user endpoints.
function isShiftRead(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  return url.pathname === "/api/shifts";
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      // Drop older cache versions on activate.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("census-shifts-") && k !== SHIFTS_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  )
);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // opaque/invalid URL — leave it to the network
  }
  if (!isShiftRead(request, url)) return; // untouched: network handles it

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHIFTS_CACHE);
      const cached = await cache.match(request);

      // Always kick off a background revalidation; only store good, complete
      // responses (never a 401/403/5xx or an opaque cross-origin one).
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      if (cached) {
        // Stale-while-revalidate: serve the cache now, finish revalidating after.
        event.waitUntil(networkPromise);
        return cached;
      }

      // Cold: no cache yet — wait for the network.
      const response = await networkPromise;
      if (response) return response;

      // Offline with nothing cached: a JSON error the app's fetcher can surface.
      return new Response(
        JSON.stringify({ statusCode: 503, message: "Offline and no cached shift data." }),
        { status: 503, headers: { "content-type": "application/json" } }
      );
    })()
  );
});
