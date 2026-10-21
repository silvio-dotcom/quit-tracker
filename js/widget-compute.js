/**
 * Widget-side money math (mirrors WidgetComputer.java and cigarettesAvoided in stats.js).
 */

const MS_DAY = 24 * 60 * 60 * 1000;

/** Default profile used in widget preview fixtures. */
export const WIDGET_FIXTURE_PROFILE = {
  cigsPerDay: 15,
  cigsPerPack: 20,
  packPrice: 12,
  currency: 'USD',
};

export function widgetCigarettesAvoided(elapsedMs, profile) {
  const perDay = Number(profile.cigsPerDay) || 0;
  if (!perDay || elapsedMs <= 0) return 0;
  return Math.max(0, Math.floor((elapsedMs * perDay) / MS_DAY));
}

export function widgetMoneyRaw(elapsedMs, profile) {
  const pack = Number(profile.cigsPerPack) || 20;
  const price = Number(profile.packPrice) || 0;
  const ppc = pack > 0 ? price / pack : 0;
  return widgetCigarettesAvoided(elapsedMs, profile) * ppc;
}
