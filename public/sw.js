const CACHE_NAME = 'stickerhub-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

// Install: pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation & API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and chrome-extension schemes
  if (req.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // CRITICAL FIX FOR IPAD / SAFARI:
  // Never intercept cross-origin CDN or Neon storage requests!
  // Intercepting cross-origin images in WebKit creates opaque cache responses,
  // causing Safari to fail CORS checks and display only broken alt text.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: Network-first, fallback to /index.html (SPA app shell)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // Static assets (images, icons, fonts, built JS/CSS in /assets/)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        return res;
      })
      .catch(() => caches.match(req))
  );
});
