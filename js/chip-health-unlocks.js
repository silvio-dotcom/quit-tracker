/**
 * Health facts shown on unlock / tap for selected smoke-free chips (not new ladder steps).
 * @typedef {{ factEn: string, factEs: string }} ChipHealthUnlockCopy
 */

/** @type {Record<string, ChipHealthUnlockCopy>} */
export const CHIP_HEALTH_UNLOCKS = {
  'chip-1w': {
    factEn: 'Your first big target — one week smoke-free.',
    factEs: 'Tu objetivo inmediato: una semana sin fumar.',
  },
  'chip-2w': {
    factEn:
      'Physical nicotine addiction is gone. Blood flow in your arms and legs is near its best.',
    factEs:
      'La adicción física ya no existe; la circulación sanguínea en piernas y brazos alcanza niveles óptimos.',
  },
  'chip-3w': {
    factEn:
      'About the time it takes for your brain to lock in a new habit and break basic psychological dependence.',
    factEs:
      'Se considera el tiempo medio para que el cerebro asimile un nuevo patrón de comportamiento y rompa la dependencia psicológica básica.',
  },
  'chip-1mo': {
    factEn:
      'Lung function can rise up to ~30%. Cough and shortness of breath are usually almost gone.',
    factEs:
      'La función pulmonar aumenta hasta un 30% y la tos y la falta de aire desaparecen casi por completo.',
  },
};

export const CHIP_HEALTH_UNLOCK_TIER_IDS = new Set(Object.keys(CHIP_HEALTH_UNLOCKS));

/** @param {string} tierId */
export function isChipHealthUnlockTier(tierId) {
  return CHIP_HEALTH_UNLOCK_TIER_IDS.has(tierId);
}

/**
 * @param {string} tierId
 * @param {'en'|'es'} [locale]
 */
export function chipHealthFact(tierId, locale = 'es') {
  const row = CHIP_HEALTH_UNLOCKS[tierId];
  if (!row) return null;
  return locale === 'es' ? row.factEs : row.factEn;
}
