
const CACHE_NAME = 'mockup-genius-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// CDNs used in importmap and head
const CDN_ORIGINS = [
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com',
  'https://esm.run',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// 1. INSTALL: Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Runtime Caching Strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Navigation Requests (HTML): Network First -> Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // B. External CDN Assets (Scripts/Styles/Fonts): Stale-While-Revalidate
  // We want these fast, but updated eventually.
  if (CDN_ORIGINS.some(origin => url.href.startsWith(origin))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Clone and update cache
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
           // Network failed, if we don't have cache, we're stuck.
           // But cachedResponse will handle it below.
           console.warn('CDN fetch failed', err);
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. API Calls (Gemini): Network Only
  // We generally don't want to cache generative AI results via SW as they are unique/expensive
  // and handled by application state.
  if (url.href.includes('generativelanguage.googleapis.com')) {
    return; // Fall through to browser default (Network)
  }

  // D. Default: Cache First for other static assets (images, local scripts)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. Handle Share Target (Optional advanced feature)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/share-target/' && event.request.method === 'POST') {
    // In a real build, we would parse FormData here.
    // For this client-side demo, we redirect to root and let the app handle logic via query params if simpler.
    event.respondWith(Response.redirect('/?action=share-target', 303));
  }
});
