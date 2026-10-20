const BUILD = '10';
const CACHE_NAME = `quit-tracker-v${BUILD}`;

const PRECACHE = [
  './',
  './index.html',
  `./css/styles.css?v=${BUILD}`,
  `./js/bootstrap.js?v=${BUILD}`,
  './js/version.js',
  `./js/sw-register.js?v=${BUILD}`,
  `./js/app.js?v=${BUILD}`,
  './js/constants.js',
  './js/health-milestones.js',
  './js/storage.js',
  './js/stats.js',
  './js/datetime.js',
  './js/achievements.js',
  './js/ranks.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

function isMutableAsset(url) {
  const path = url.pathname;
  if (path.endsWith('/sw.js')) return true;
  return (
    path.endsWith('.html') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('/') ||
    url.search.includes('v=')
  );
}

function fetchNoStore(request) {
  return fetch(new Request(request, { cache: 'no-store' }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE.map((path) => {
            const url = new URL(path, self.location).href;
            return fetchNoStore(url).then((response) => {
              if (response.ok) return cache.put(url, response);
            });
          })
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isMutableAsset(url)) {
    event.respondWith(
      fetchNoStore(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetchNoStore(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
