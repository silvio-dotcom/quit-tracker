/**
 * Detect Capacitor native shell (Android/iOS). Testable without a full browser.
 * @param {{ userAgent?: string, capacitor?: unknown, htmlClassNative?: boolean }} [options]
 */
export function detectNativeEnvironment(options = {}) {
  if (options.htmlClassNative) return true;
  const ua = options.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (ua.includes('QuitTrackerAndroid')) return true;

  const cap = options.capacitor ?? (typeof window !== 'undefined' ? window.Capacitor : undefined);
  if (!cap || typeof cap !== 'object') return false;

  try {
    if (typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return true;
    if (typeof cap.getPlatform === 'function') {
      const p = cap.getPlatform();
      if (p === 'android' || p === 'ios') return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** @returns {boolean} True when running inside the Capacitor Android/iOS shell. */
export function isNativePlatform() {
  const htmlClassNative =
    typeof document !== 'undefined' && document.documentElement.classList.contains('qt-native-android');
  return detectNativeEnvironment({ htmlClassNative });
}
