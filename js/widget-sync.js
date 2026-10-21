import { isNativePlatform } from './platform.js';
import { CURRENCIES } from './constants.js';
import { xpLevelProgress, MAX_LEVEL } from './xp.js';

/**
 * Mirror quit profile + level to the Android home screen widget (native only).
 * @param {import('./constants.js').defaultState extends () => infer S ? S : never} state
 */
export async function syncWidgetSnapshot(state, now = Date.now()) {
  if (!isNativePlatform()) return;
  const bridge = window.Capacitor?.Plugins?.WidgetBridge;
  if (!bridge?.sync) return;

  const p = state.profile || {};
  const xp = xpLevelProgress(state, now);
  const snapshot = {
    quitDateIso: p.quitDate || null,
    cigsPerDay: Number(p.cigsPerDay) || 0,
    cigsPerPack: Number(p.cigsPerPack) || 20,
    packPrice: Number(p.packPrice) || 0,
    currency: p.currency || 'USD',
    currencySymbol: CURRENCIES[p.currency]?.symbol ?? '$',
    level: xp.level,
    maxLevel: MAX_LEVEL,
    levelMaxed: Boolean(xp.maxed),
  };

  try {
    await bridge.sync({ snapshot });
  } catch {
    /* widget optional until native build */
  }
}
