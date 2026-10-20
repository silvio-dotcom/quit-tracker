const M = 60 * 1000;
const H = 60 * M;
const D = 24 * H;
const MO = 30 * D;
const Y = 365 * D;

/** Time smoke-free badges (absolute; max 1 year). */
export const TIME_ACHIEVEMENTS = [
  { id: 'time-5m', category: 'time', icon: '🕹️', title: '5 minutes', desc: 'First pixels of freedom.', ms: 5 * M },
  { id: 'time-10m', category: 'time', icon: '👾', title: '10 minutes', desc: 'Double digits smoke-free.', ms: 10 * M },
  { id: 'time-20m', category: 'time', icon: '💪', title: '20 minutes', desc: 'The hardest stretch — you did it.', ms: 20 * M },
  { id: 'time-30m', category: 'time', icon: '⭐', title: '30 minutes', desc: 'Half an hour clear.', ms: 30 * M },
  { id: 'time-45m', category: 'time', icon: '🪙', title: '45 minutes', desc: 'Almost an hour!', ms: 45 * M },
  { id: 'time-1h', category: 'time', icon: '⏱️', title: '1 hour', desc: 'One full hour smoke-free.', ms: H },
  { id: 'time-3h', category: 'time', icon: '🎮', title: '3 hours', desc: 'Three hours on the clock.', ms: 3 * H },
  { id: 'time-6h', category: 'time', icon: '🌤️', title: '6 hours', desc: 'Half a work day without a cigarette.', ms: 6 * H },
  { id: 'time-12h', category: 'time', icon: '🌙', title: '12 hours', desc: 'A half-day milestone.', ms: 12 * H },
  { id: 'time-24h', category: 'time', icon: '🌅', title: '24 hours', desc: 'A full day as a non-smoker.', ms: D },
  { id: 'time-3d', category: 'time', icon: '🔥', title: '3 days', desc: 'Nicotine is clearing out.', ms: 3 * D },
  { id: 'time-4d', category: 'time', icon: '🧱', title: '4 days', desc: 'Four days stacked.', ms: 4 * D },
  { id: 'time-7d', category: 'time', icon: '📅', title: '7 days', desc: 'One week smoke-free.', ms: 7 * D },
  { id: 'time-10d', category: 'time', icon: '🔟', title: '10 days', desc: 'Double-digit days.', ms: 10 * D },
  { id: 'time-14d', category: 'time', icon: '🛡️', title: '2 weeks', desc: 'Habits are starting to shift.', ms: 14 * D },
  { id: 'time-21d', category: 'time', icon: '🎯', title: '21 days', desc: 'Three weeks strong.', ms: 21 * D },
  { id: 'time-1mo', category: 'time', icon: '🏅', title: '1 month', desc: 'A major milestone.', ms: MO },
  { id: 'time-2mo', category: 'time', icon: '⭐', title: '2 months', desc: 'Two months of freedom.', ms: 2 * MO },
  { id: 'time-3mo', category: 'time', icon: '💎', title: '3 months', desc: 'Real momentum.', ms: 3 * MO },
  { id: 'time-6mo', category: 'time', icon: '🚀', title: '6 months', desc: 'Half a year smoke-free.', ms: 6 * MO },
  { id: 'time-9mo', category: 'time', icon: '🌈', title: '9 months', desc: 'Nine months strong.', ms: 9 * MO },
  { id: 'time-1y', category: 'time', icon: '🎉', title: '1 year', desc: 'A full year as a non-smoker.', ms: Y },
];

/** Scaled to 1-year cigarette projection (yearFraction 0–1). */
export const CIGS_SPECS = [
  { id: 'cigs-1', yearFraction: 0.004, icon: '🚭', title: 'First cigarette', desc: 'One cigarette not smoked.' },
  { id: 'cigs-5', yearFraction: 0.012, icon: '🕹️', title: '5 avoided', desc: 'A handful skipped.' },
  { id: 'cigs-10', yearFraction: 0.022, icon: '🔟', title: '10 avoided', desc: 'Ten cigarettes skipped.' },
  { id: 'cigs-25', yearFraction: 0.04, icon: '🎮', title: '25 avoided', desc: 'Building momentum.' },
  { id: 'cigs-first-pack', packFraction: 0.055, icon: '📦', title: 'First pack', desc: 'A full pack avoided.' },
  { id: 'cigs-50', yearFraction: 0.08, icon: '🌿', title: '50 avoided', desc: 'Fifty cigarettes not smoked.' },
  { id: 'cigs-100', yearFraction: 0.12, icon: '💯', title: '100 avoided', desc: 'A hundred cigarettes skipped.' },
  { id: 'cigs-200', yearFraction: 0.17, icon: '🪙', title: '200 avoided', desc: 'Two hundred clear.' },
  { id: 'cigs-5pack', packFraction: 0.22, icon: '📦', title: '5 packs', desc: 'Five packs avoided.' },
  { id: 'cigs-10pack', packFraction: 0.3, icon: '🎁', title: '10 packs', desc: 'Ten packs not smoked.' },
  { id: 'cigs-250', yearFraction: 0.38, icon: '🚬', title: '250 avoided', desc: 'Quarter thousand skipped.' },
  { id: 'cigs-500', yearFraction: 0.48, icon: '🏔️', title: '500 avoided', desc: 'Five hundred cigarettes skipped.' },
  { id: 'cigs-750', yearFraction: 0.58, icon: '⛰️', title: '750 avoided', desc: 'Seven fifty skipped.' },
  { id: 'cigs-1000', yearFraction: 0.68, icon: '🌟', title: '1,000 avoided', desc: 'A thousand cigarettes avoided.' },
  { id: 'cigs-1500', yearFraction: 0.78, icon: '💫', title: '1,500 avoided', desc: 'Fifteen hundred not smoked.' },
  { id: 'cigs-2500', yearFraction: 0.88, icon: '🔥', title: '2,500 avoided', desc: 'Massive stack of skips.' },
  { id: 'cigs-year', yearFraction: 1, icon: '🏰', title: 'Year count', desc: 'Your one-year cigarette total.' },
];

export const MONEY_SPECS = [
  { id: 'money-5', yearFraction: 0.01, icon: '🪙', title: 'First savings', desc: 'First coins kept.' },
  { id: 'money-10', yearFraction: 0.025, icon: '💵', title: '10 saved', desc: 'First savings milestone.' },
  { id: 'money-15', yearFraction: 0.04, icon: '🎮', title: '15 saved', desc: 'Extra life for your wallet.' },
  { id: 'money-25', yearFraction: 0.06, icon: '🪙', title: '25 saved', desc: 'Money back in your pocket.' },
  { id: 'money-50', yearFraction: 0.09, icon: '💰', title: '50 saved', desc: 'Fifty kept.' },
  { id: 'money-75', yearFraction: 0.13, icon: '👾', title: '75 saved', desc: 'Seventy-five in the bank.' },
  { id: 'money-100', yearFraction: 0.17, icon: '💸', title: '100 saved', desc: 'Serious savings.' },
  { id: 'money-150', yearFraction: 0.23, icon: '🏦', title: '150 saved', desc: 'Growing stash.' },
  { id: 'money-250', yearFraction: 0.32, icon: '💎', title: '250 saved', desc: 'A quarter grand.' },
  { id: 'money-500', yearFraction: 0.45, icon: '🎁', title: '500 saved', desc: 'Half a grand kept.' },
  { id: 'money-750', yearFraction: 0.58, icon: '🌟', title: '750 saved', desc: 'Seven-fifty saved.' },
  { id: 'money-1000', yearFraction: 0.7, icon: '🏆', title: '1,000 saved', desc: 'Four digits saved.' },
  { id: 'money-2500', yearFraction: 0.85, icon: '👑', title: '2,500 saved', desc: 'Major milestone.' },
  { id: 'money-year', yearFraction: 1, icon: '🚀', title: 'Year savings', desc: 'Your one-year money saved.' },
];

export const TIMEBACK_SPECS = [
  { id: 'timeback-30m', yearFraction: 0.02, icon: '⏳', title: '30 min back', desc: 'Half an hour of life regained.' },
  { id: 'timeback-1h', yearFraction: 0.05, icon: '🕐', title: '1 hour back', desc: 'An hour returned to you.' },
  { id: 'timeback-3h', yearFraction: 0.1, icon: '🕒', title: '3 hours back', desc: 'Three hours regained.' },
  { id: 'timeback-6h', yearFraction: 0.16, icon: '🌤️', title: '6 hours back', desc: 'A quarter day back.' },
  { id: 'timeback-12h', yearFraction: 0.24, icon: '🌙', title: '12 hours back', desc: 'Half a day regained.' },
  { id: 'timeback-1d', yearFraction: 0.32, icon: '📆', title: '1 day back', desc: 'A full day of time back.' },
  { id: 'timeback-3d', yearFraction: 0.44, icon: '🗓️', title: '3 days back', desc: 'Three days regained.' },
  { id: 'timeback-1w', yearFraction: 0.56, icon: '📅', title: '1 week back', desc: 'A week of life returned.' },
  { id: 'timeback-1mo', yearFraction: 0.7, icon: '🏅', title: '1 month back', desc: 'A month regained.' },
  { id: 'timeback-3mo', yearFraction: 0.85, icon: '💎', title: '3 months back', desc: 'Three months of time back.' },
  { id: 'timeback-year', yearFraction: 1, icon: '🎉', title: '1 year back', desc: 'A year of life regained.' },
];

export function allBadgeTemplateIds() {
  return [
    ...TIME_ACHIEVEMENTS.map((a) => a.id),
    ...CIGS_SPECS.map((a) => a.id),
    ...MONEY_SPECS.map((a) => a.id),
    ...TIMEBACK_SPECS.map((a) => a.id),
  ];
}
