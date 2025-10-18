const CACHE_NAME = "cardiology-suite-v3";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles/style.css",
  "./src/core/app.js",
  "./manifest.json",
  "./data/db.json",
  "./data/plan_rules/plan_rules.json",
  "./data/meds/cardiac_meds.json",
  "./data/guidelines/acc_guidelines.json",
  "./data/teaching/teaching_content.json",
  "./data/labs_reference/labs_reference.json",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()),
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip caching for chrome-extension URLs
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Bypass cache for explicit versioned requests (cache-busting)
  if (event.request.url.includes("?v=")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle normal requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Don't cache if:
        // 1. not successful
        // 2. not a 'basic' type (i.e., from our origin)
        // 3. is a chrome-extension URL
        if (
          !response ||
          response.status !== 200 ||
          response.type !== "basic" ||
          response.url.startsWith("chrome-extension://")
        ) {
          return response;
        }

        try {
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              if (event.request.url.startsWith("http")) {
                cache.put(event.request, responseToCache);
              }
            })
            .catch((err) => {
              console.warn("Cache storage failed:", err);
            });
        } catch (err) {
          console.warn("Cache operation failed:", err);
        }

        return response;
      });
    }),
  );
});
