/** @returns {boolean} True when running inside the Capacitor Android/iOS shell. */
export function isNativePlatform() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}
