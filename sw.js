const BUILD = '28';
const CACHE_NAME = `quit-tracker-v${BUILD}`;

const PRECACHE = [
  './',
  './index.html',
  `./css/styles.css?v=${BUILD}`,
  `./css/pixel-theme.css?v=${BUILD}`,
  `./js/bootstrap.js?v=${BUILD}`,
  './js/version.js',
  `./js/sw-register.js?v=${BUILD}`,
  `./js/app.js?v=${BUILD}`,
  './js/constants.js',
  './js/health-milestones.js',
  './js/chip-health-unlocks.js',
  './js/chip-health-unlock-ui.js',
  './js/storage.js',
  './js/locale.js',
  './js/stats.js',
  './js/datetime.js',
  './js/install.js',
  './js/achievements.js',
  './js/ranks.js',
  './js/next-up.js',
  './js/milestone-alerts.js',
  './js/share-card.js',
  './js/platform.js',
  './js/milestone-schedule.js',
  './js/native-notifications.js',
  './js/native-shell.js',
  './js/back-handler.js',
  './js/share-message.js',
  './js/share-ui.js',
  './js/chip-art.js',
  './js/chips.js',
  './js/chips-ui.js',
  './js/achievements-catalog.js',
  './js/badges-screen.js',
  './js/xp.js',
  './js/badge-year-scale.js',
  './js/pixel-nav-icons.js',
  './fonts/PressStart2P-Regular.ttf',
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
  if (event.data?.type === 'SHOW_MILESTONE') {
    const { title, body, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Dejar de fumar', {
        body: body || '',
        icon: new URL('icons/icon-192.png', self.location).href,
        tag: tag || 'milestone',
      })
    );
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
