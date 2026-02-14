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

self.addEventListener('push', (event) => {
    let data = { title: 'New Update', body: 'You have a new notification.' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Update', body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: '/download.png',
        badge: '/download.png',
        data: data.url || '/', // URL to open on click
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'View Details' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open and focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests and same-origin requests (optional but safer)
    if (request.method !== 'GET') return;

    // Check if it's a navigation request or an entry point
    const isNavigation = request.mode === 'navigate' ||
        url.pathname === '/' ||
        url.pathname.endsWith('index.html');

    if (isNavigation) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, cacheCopy);
                    });
                    return networkResponse;
                })
                .catch(() => caches.match(request) || fetch(request)) // Fallback to cache or try network again
        );
        return;
    }

    // Asset handling
    const isAsset = url.pathname.includes('/assets/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css');

    if (isAsset) {
        // Network Only for assets to avoid MIME type errors
        event.respondWith(
            fetch(request).catch(() => {
                // If network fails for a script/css, better to fail than serve index.html
                return new Response('Asset not available', { status: 404 });
            })
        );
    } else {
        // Cache First for everything else (images, manifests, etc.)
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
        );
    }
});
