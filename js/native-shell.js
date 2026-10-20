import { isNativePlatform } from './platform.js';

/** Apply status bar + safe-area padding for edge-to-edge (API 35+). */
export async function initNativeShell() {
  if (!isNativePlatform()) return;
  document.documentElement.classList.add('native-capacitor');
  document.body.classList.add('native-android');

  const StatusBar = window.Capacitor?.Plugins?.StatusBar;
  if (StatusBar) {
    try {
      await StatusBar.setBackgroundColor({ color: '#0f1419' });
      await StatusBar.setStyle({ style: 'LIGHT' });
      await StatusBar.setOverlaysWebView({ overlay: true });
      const info = await StatusBar.getInfo();
      if (info?.height) {
        document.documentElement.style.setProperty('--safe-area-inset-top', `${info.height}px`);
      }
    } catch {
      /* plugin optional until cap sync */
    }
  }

  const root = document.documentElement;
  const bottomFallback = 'max(env(safe-area-inset-bottom, 0px), 20px)';
  root.style.setProperty('--safe-area-inset-bottom', bottomFallback);
  root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
  root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
}

/** Reschedule milestone alarms when app returns (covers post-reboot catch-up). */
export function onNativeAppActive(callback) {
  if (!isNativePlatform()) return;
  const App = window.Capacitor?.Plugins?.App;
  if (!App?.addListener) return;
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) callback();
  });
  App.addListener('resume', () => callback());
}
