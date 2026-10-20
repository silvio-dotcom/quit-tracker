import { isNativePlatform } from './platform.js';

/**
 * Predictive back: modal → leave tab to home → exit app.
 * @param {{ closeTopModal: () => boolean, getActiveTab: () => string, goHome: () => void, exitApp: () => void }} handlers
 */
export function registerPredictiveBack(handlers) {
  if (!isNativePlatform()) return;
  const App = window.Capacitor?.Plugins?.App;
  if (!App?.addListener) return;

  App.addListener('backButton', () => {
    if (handlers.closeTopModal()) return;
    const tab = handlers.getActiveTab();
    if (tab && tab !== 'home') {
      handlers.goHome();
      return;
    }
    handlers.exitApp();
  });
}
