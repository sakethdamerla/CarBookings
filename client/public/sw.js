// Minimal service worker for PWA installation
const CACHE_NAME = 'car-booking-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/vite.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Check if it's a navigation request or index.html
    const isNavigation = event.request.mode === 'navigate' ||
        event.request.url.endsWith('/') ||
        event.request.url.endsWith('index.html');

    if (isNavigation) {
        // Network First strategy for entry points
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache with the new version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache First strategy for other assets (images, etc)
        // But NOT for .js files to avoid MIME type errors on missing chunks
        const isScript = event.request.url.endsWith('.js');

        if (isScript) {
            // Network Only for scripts to ensure we never get stale hashes
            event.respondWith(fetch(event.request));
        } else {
            event.respondWith(
                caches.match(event.request).then((response) => {
                    return response || fetch(event.request);
                })
            );
        }
    }
});
