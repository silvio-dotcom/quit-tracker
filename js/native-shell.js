import { isNativePlatform } from './platform.js';

const SKY = '#5c94fc';

/** Pixel 9 Pro XL reference (412×915 CSS px): status bar + hole-punch ≈ 52dp, gesture nav ≈ 24dp. */
export const NATIVE_FALLBACK_INSET_TOP_PX = 52;
export const NATIVE_FALLBACK_INSET_BOTTOM_PX = 24;

function applyInsetVars(root, topPx, bottomPx, leftPx = 0, rightPx = 0) {
  const top = `${topPx}px`;
  const bottom = `${bottomPx}px`;
  const left = `${leftPx}px`;
  const right = `${rightPx}px`;
  root.style.setProperty('--sat', top);
  root.style.setProperty('--sab', bottom);
  root.style.setProperty('--sal', left);
  root.style.setProperty('--sar', right);
  root.style.setProperty('--safe-area-inset-top', top);
  root.style.setProperty('--safe-area-inset-bottom', bottom);
  root.style.setProperty('--safe-area-inset-left', left);
  root.style.setProperty('--safe-area-inset-right', right);
  root.style.setProperty('--safe-top', top);
  root.style.setProperty('--safe-bottom', bottom);
  root.style.setProperty('--safe-left', left);
  root.style.setProperty('--safe-right', right);
}

function readInsetPx(name) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw || raw === '0' || raw === '0px') return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Apply status bar + safe-area padding for edge-to-edge (API 35+). */
export async function initNativeShell() {
  if (!isNativePlatform()) return;
  document.documentElement.classList.add('qt-native-android', 'native-capacitor');
  document.body.classList.add('native-android');

  const root = document.documentElement;
  const StatusBar = window.Capacitor?.Plugins?.StatusBar;
  let topPx = 0;
  let bottomPx = 0;
  if (StatusBar) {
    try {
      await StatusBar.setBackgroundColor({ color: SKY });
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setOverlaysWebView({ overlay: true });
      const info = await StatusBar.getInfo();
      if (info?.height && info.height > 0) topPx = info.height;
    } catch {
      /* plugin optional until cap sync */
    }
  }

  if (topPx <= 0) topPx = readInsetPx('--sat') || NATIVE_FALLBACK_INSET_TOP_PX;
  if (bottomPx <= 0) bottomPx = readInsetPx('--sab') || NATIVE_FALLBACK_INSET_BOTTOM_PX;
  applyInsetVars(root, topPx, bottomPx);
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
