import { APP_BUILD } from './version.js';

const v = APP_BUILD;
window.__QT_BUILD__ = v;

async function loadApp() {
  await import(`./app.js?v=${encodeURIComponent(v)}`);
}

function scheduleRecoveryWatchdog() {
  window.addEventListener('load', () => {
    window.setTimeout(async () => {
      if (window.__QT_APP_READY__) return;
      const key = `qt-recovery-${v}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* best effort */
      }
      const url = new URL(location.href);
      url.searchParams.set('_qt', v);
      location.replace(url.toString());
    }, 2500);
  });
}

scheduleRecoveryWatchdog();
loadApp().catch((err) => {
  console.error('Quit Tracker failed to start', err);
});
