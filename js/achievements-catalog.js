const M = 60 * 1000;
const H = 60 * M;
const D = 24 * H;
const MO = 30 * D;
const Y = 365 * D;

/** @type {import('./constants.js').ACHIEVEMENTS} */
export const ACHIEVEMENTS = [
  // Time smoke-free (dense early + long-term)
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
  { id: 'time-2y', category: 'time', icon: '🏆', title: '2 years', desc: 'Two years smoke-free.', ms: 2 * Y },
  { id: 'time-5y', category: 'time', icon: '👑', title: '5 years', desc: 'Five years — incredible.', ms: 5 * Y },

  // Cigarettes avoided
  { id: 'cigs-1', category: 'cigs', icon: '🚭', title: 'First cigarette', desc: 'One cigarette not smoked.', count: 1 },
  { id: 'cigs-5', category: 'cigs', icon: '🕹️', title: '5 avoided', desc: 'A handful skipped.', count: 5 },
  { id: 'cigs-10', category: 'cigs', icon: '🔟', title: '10 avoided', desc: 'Ten cigarettes skipped.', count: 10 },
  { id: 'cigs-25', category: 'cigs', icon: '🎮', title: '25 avoided', desc: 'Quarter century of skips.', count: 25 },
  { id: 'cigs-first-pack', category: 'cigs', icon: '📦', title: 'First pack', desc: 'A full pack avoided.', packs: 1 },
  { id: 'cigs-50', category: 'cigs', icon: '🌿', title: '50 avoided', desc: 'Fifty cigarettes not smoked.', count: 50 },
  { id: 'cigs-100', category: 'cigs', icon: '💯', title: '100 avoided', desc: 'A hundred cigarettes skipped.', count: 100 },
  { id: 'cigs-200', category: 'cigs', icon: '🪙', title: '200 avoided', desc: 'Two hundred clear.', count: 200 },
  { id: 'cigs-5pack', category: 'cigs', icon: '📦', title: '5 packs', desc: 'Five packs avoided.', packs: 5 },
  { id: 'cigs-10pack', category: 'cigs', icon: '🎁', title: '10 packs', desc: 'Ten packs not smoked.', packs: 10 },
  { id: 'cigs-250', category: 'cigs', icon: '🚬', title: '250 avoided', desc: 'Two hundred fifty cigarettes.', count: 250 },
  { id: 'cigs-500', category: 'cigs', icon: '🏔️', title: '500 avoided', desc: 'Five hundred cigarettes skipped.', count: 500 },
  { id: 'cigs-750', category: 'cigs', icon: '⛰️', title: '750 avoided', desc: 'Seven hundred fifty skipped.', count: 750 },
  { id: 'cigs-1000', category: 'cigs', icon: '🌟', title: '1,000 avoided', desc: 'A thousand cigarettes avoided.', count: 1000 },
  { id: 'cigs-1500', category: 'cigs', icon: '💫', title: '1,500 avoided', desc: 'Fifteen hundred not smoked.', count: 1500 },
  { id: 'cigs-2500', category: 'cigs', icon: '🔥', title: '2,500 avoided', desc: 'Massive stack of skips.', count: 2500 },
  { id: 'cigs-5000', category: 'cigs', icon: '🏰', title: '5,000 avoided', desc: 'Five thousand — legendary.', count: 5000 },

  // Money saved (amount in profile currency)
  { id: 'money-5', category: 'money', icon: '🪙', title: '5 saved', desc: 'First coins kept.', amount: 5 },
  { id: 'money-10', category: 'money', icon: '💵', title: '10 saved', desc: 'First savings milestone.', amount: 10 },
  { id: 'money-15', category: 'money', icon: '🎮', title: '15 saved', desc: 'Extra life for your wallet.', amount: 15 },
  { id: 'money-25', category: 'money', icon: '🪙', title: '25 saved', desc: 'Money back in your pocket.', amount: 25 },
  { id: 'money-50', category: 'money', icon: '💰', title: '50 saved', desc: 'Fifty kept.', amount: 50 },
  { id: 'money-75', category: 'money', icon: '👾', title: '75 saved', desc: 'Seventy-five in the bank.', amount: 75 },
  { id: 'money-100', category: 'money', icon: '💸', title: '100 saved', desc: 'Serious savings.', amount: 100 },
  { id: 'money-150', category: 'money', icon: '🏦', title: '150 saved', desc: 'Growing stash.', amount: 150 },
  { id: 'money-250', category: 'money', icon: '💎', title: '250 saved', desc: 'A quarter grand.', amount: 250 },
  { id: 'money-500', category: 'money', icon: '🎁', title: '500 saved', desc: 'Half a grand kept.', amount: 500 },
  { id: 'money-750', category: 'money', icon: '🌟', title: '750 saved', desc: 'Seven-fifty saved.', amount: 750 },
  { id: 'money-1000', category: 'money', icon: '🏆', title: '1,000 saved', desc: 'Four digits saved.', amount: 1000 },
  { id: 'money-2500', category: 'money', icon: '👑', title: '2,500 saved', desc: 'Major milestone.', amount: 2500 },
  { id: 'money-5000', category: 'money', icon: '🚀', title: '5,000 saved', desc: 'Five thousand saved.', amount: 5000 },

  // Time regained (6 min per cigarette)
  { id: 'timeback-30m', category: 'timeback', icon: '⏳', title: '30 min back', desc: 'Half an hour of life regained.', regainedMinutes: 30 },
  { id: 'timeback-1h', category: 'timeback', icon: '🕐', title: '1 hour back', desc: 'An hour returned to you.', regainedMinutes: 60 },
  { id: 'timeback-3h', category: 'timeback', icon: '🕒', title: '3 hours back', desc: 'Three hours regained.', regainedMinutes: 180 },
  { id: 'timeback-6h', category: 'timeback', icon: '🌤️', title: '6 hours back', desc: 'A quarter day back.', regainedMinutes: 360 },
  { id: 'timeback-12h', category: 'timeback', icon: '🌙', title: '12 hours back', desc: 'Half a day regained.', regainedMinutes: 720 },
  { id: 'timeback-1d', category: 'timeback', icon: '📆', title: '1 day back', desc: 'A full day of time back.', regainedMinutes: 1440 },
  { id: 'timeback-3d', category: 'timeback', icon: '🗓️', title: '3 days back', desc: 'Three days regained.', regainedMinutes: 4320 },
  { id: 'timeback-1w', category: 'timeback', icon: '📅', title: '1 week back', desc: 'A week of life returned.', regainedMinutes: 10080 },
  { id: 'timeback-1mo', category: 'timeback', icon: '🏅', title: '1 month back', desc: 'A month regained.', regainedMinutes: 43200 },
  { id: 'timeback-3mo', category: 'timeback', icon: '💎', title: '3 months back', desc: 'Three months of time back.', regainedMinutes: 129600 },
  { id: 'timeback-1y', category: 'timeback', icon: '🎉', title: '1 year back', desc: 'A year of life regained.', regainedMinutes: 525600 },
];
