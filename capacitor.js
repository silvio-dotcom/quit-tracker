/**
 * PWA stub: native APK ships the real Capacitor bridge from node_modules during cap sync.
 * Keeps GitHub Pages free of 404s and ensures isNativePlatform() is false on the web.
 */
(function () {
  if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function') return;
  window.Capacitor = {
    isNativePlatform: function () {
      return false;
    },
    getPlatform: function () {
      return 'web';
    },
    Plugins: {},
  };
})();
