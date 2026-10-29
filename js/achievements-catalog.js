const M = 60 * 1000;
const H = 60 * M;
const D = 24 * H;
const MO = 30 * D;
const Y = 365 * D;

/** Time smoke-free badges (absolute; max 1 year). */
export const TIME_ACHIEVEMENTS = [
  { id: 'time-5m', category: 'time', icon: '🕹️', title: '5 minutos', desc: 'Tus primeros píxeles de libertad.', ms: 5 * M },
  { id: 'time-10m', category: 'time', icon: '👾', title: '10 minutos', desc: 'Dos dígitos sin fumar.', ms: 10 * M },
  { id: 'time-20m', category: 'time', icon: '💪', title: '20 minutos', desc: 'El tramo más duro — lo lograste.', ms: 20 * M },
  { id: 'time-30m', category: 'time', icon: '⭐', title: '30 minutos', desc: 'Media hora limpio.', ms: 30 * M },
  { id: 'time-45m', category: 'time', icon: '🪙', title: '45 minutos', desc: '¡Casi una hora!', ms: 45 * M },
  { id: 'time-1h', category: 'time', icon: '⏱️', title: '1 hora', desc: 'Una hora entera sin fumar.', ms: H },
  { id: 'time-3h', category: 'time', icon: '🎮', title: '3 horas', desc: 'Tres horas en el reloj.', ms: 3 * H },
  { id: 'time-6h', category: 'time', icon: '🌤️', title: '6 horas', desc: 'Medio día de trabajo sin cigarrillo.', ms: 6 * H },
  { id: 'time-12h', category: 'time', icon: '🌙', title: '12 horas', desc: 'Medio día de hito.', ms: 12 * H },
  { id: 'time-24h', category: 'time', icon: '🌅', title: '24 horas', desc: 'Un día completo como no fumador.', ms: D },
  { id: 'time-3d', category: 'time', icon: '🔥', title: '3 días', desc: 'La nicotina se va limpiando.', ms: 3 * D },
  { id: 'time-4d', category: 'time', icon: '🧱', title: '4 días', desc: 'Cuatro días acumulados.', ms: 4 * D },
  { id: 'time-7d', category: 'time', icon: '📅', title: '7 días', desc: 'Una semana sin fumar.', ms: 7 * D },
  { id: 'time-10d', category: 'time', icon: '🔟', title: '10 días', desc: 'Días de dos dígitos.', ms: 10 * D },
  { id: 'time-14d', category: 'time', icon: '🛡️', title: '2 semanas', desc: 'Los hábitos empiezan a cambiar.', ms: 14 * D },
  { id: 'time-21d', category: 'time', icon: '🎯', title: '21 días', desc: 'Tres semanas firmes.', ms: 21 * D },
  { id: 'time-1mo', category: 'time', icon: '🏅', title: '1 mes', desc: 'Un hito importante.', ms: MO },
  { id: 'time-2mo', category: 'time', icon: '⭐', title: '2 meses', desc: 'Dos meses de libertad.', ms: 2 * MO },
  { id: 'time-3mo', category: 'time', icon: '💎', title: '3 meses', desc: 'Impulso real.', ms: 3 * MO },
  { id: 'time-6mo', category: 'time', icon: '🚀', title: '6 meses', desc: 'Medio año sin fumar.', ms: 6 * MO },
  { id: 'time-9mo', category: 'time', icon: '🌈', title: '9 meses', desc: 'Nueve meses fuertes.', ms: 9 * MO },
  { id: 'time-1y', category: 'time', icon: '🎉', title: '1 año', desc: 'Un año entero como no fumador.', ms: Y },
];

/** Scaled to 1-year projection — titles/descriptions generated in badge-year-scale.js */
export const CIGS_SPECS = [
  { id: 'cigs-1', yearFraction: 0.004, icon: '🚭' },
  { id: 'cigs-5', yearFraction: 0.012, icon: '🕹️' },
  { id: 'cigs-10', yearFraction: 0.022, icon: '🔟' },
  { id: 'cigs-25', yearFraction: 0.04, icon: '🎮' },
  { id: 'cigs-first-pack', packFraction: 0.055, icon: '📦' },
  { id: 'cigs-50', yearFraction: 0.08, icon: '🌿' },
  { id: 'cigs-100', yearFraction: 0.12, icon: '💯' },
  { id: 'cigs-200', yearFraction: 0.17, icon: '🪙' },
  { id: 'cigs-5pack', packFraction: 0.22, icon: '📦' },
  { id: 'cigs-10pack', packFraction: 0.3, icon: '🎁' },
  { id: 'cigs-250', yearFraction: 0.38, icon: '🚬' },
  { id: 'cigs-500', yearFraction: 0.48, icon: '🏔️' },
  { id: 'cigs-750', yearFraction: 0.58, icon: '⛰️' },
  { id: 'cigs-1000', yearFraction: 0.68, icon: '🌟' },
  { id: 'cigs-1500', yearFraction: 0.78, icon: '💫' },
  { id: 'cigs-2500', yearFraction: 0.88, icon: '🔥' },
  { id: 'cigs-year', yearFraction: 1, icon: '🏰' },
];

export const MONEY_SPECS = [
  { id: 'money-5', yearFraction: 0.01, icon: '🪙' },
  { id: 'money-10', yearFraction: 0.025, icon: '💵' },
  { id: 'money-15', yearFraction: 0.04, icon: '🎮' },
  { id: 'money-25', yearFraction: 0.06, icon: '🪙' },
  { id: 'money-50', yearFraction: 0.09, icon: '💰' },
  { id: 'money-75', yearFraction: 0.13, icon: '👾' },
  { id: 'money-100', yearFraction: 0.17, icon: '💸' },
  { id: 'money-150', yearFraction: 0.23, icon: '🏦' },
  { id: 'money-250', yearFraction: 0.32, icon: '💎' },
  { id: 'money-500', yearFraction: 0.45, icon: '🎁' },
  { id: 'money-750', yearFraction: 0.58, icon: '🌟' },
  { id: 'money-1000', yearFraction: 0.7, icon: '🏆' },
  { id: 'money-2500', yearFraction: 0.85, icon: '👑' },
  { id: 'money-year', yearFraction: 1, icon: '🚀' },
];

export const TIMEBACK_SPECS = [
  { id: 'timeback-30m', yearFraction: 0.02, icon: '⏳' },
  { id: 'timeback-1h', yearFraction: 0.05, icon: '🕐' },
  { id: 'timeback-3h', yearFraction: 0.1, icon: '🕒' },
  { id: 'timeback-6h', yearFraction: 0.16, icon: '🌤️' },
  { id: 'timeback-12h', yearFraction: 0.24, icon: '🌙' },
  { id: 'timeback-1d', yearFraction: 0.32, icon: '📆' },
  { id: 'timeback-3d', yearFraction: 0.44, icon: '🗓️' },
  { id: 'timeback-1w', yearFraction: 0.56, icon: '📅' },
  { id: 'timeback-1mo', yearFraction: 0.7, icon: '🏅' },
  { id: 'timeback-3mo', yearFraction: 0.85, icon: '💎' },
  { id: 'timeback-year', yearFraction: 1, icon: '🎉' },
];

export function allBadgeTemplateIds() {
  return [
    ...TIME_ACHIEVEMENTS.map((a) => a.id),
    ...CIGS_SPECS.map((a) => a.id),
    ...MONEY_SPECS.map((a) => a.id),
    ...TIMEBACK_SPECS.map((a) => a.id),
  ];
}
