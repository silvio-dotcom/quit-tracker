/** @typedef {'USD'|'NIO'|'EUR'|'GBP'|'CAD'|'AUD'} CurrencyCode */

export const STORAGE_KEY = 'quit-tracker-data-v1';

export const CURRENCIES = {
  USD: { symbol: '$', label: 'US Dollar' },
  NIO: { symbol: 'C$', label: 'Nicaraguan córdoba' },
  EUR: { symbol: '€', label: 'Euro' },
  GBP: { symbol: '£', label: 'British Pound' },
  CAD: { symbol: 'CA$', label: 'Canadian Dollar' },
  AUD: { symbol: 'A$', label: 'Australian Dollar' },
};

const M = 60 * 1000;
const H = 60 * M;
const D = 24 * H;
const MO = 30 * D;
const Y = 365 * D;

/** @typedef {'time'|'cigs'|'money'} BadgeCategoryId */

/**
 * QuitNow-style badge definitions (single source of truth).
 * @type {Array<{
 *   id: string,
 *   category: BadgeCategoryId,
 *   icon: string,
 *   title: string,
 *   desc: string,
 *   ms?: number,
 *   count?: number,
 *   packs?: number,
 *   amount?: number,
 * }>}
 */
export const ACHIEVEMENTS = [
  // —— Time smoke-free ——
  { id: 'time-20m', category: 'time', icon: '💪', title: '20 minutes', desc: 'The hardest stretch — you did it.', ms: 20 * M },
  { id: 'time-1h', category: 'time', icon: '⏱️', title: '1 hour', desc: 'One full hour smoke-free.', ms: H },
  { id: 'time-6h', category: 'time', icon: '🌤️', title: '6 hours', desc: 'Half a work day without a cigarette.', ms: 6 * H },
  { id: 'time-12h', category: 'time', icon: '🌙', title: '12 hours', desc: 'A half-day milestone.', ms: 12 * H },
  { id: 'time-24h', category: 'time', icon: '🌅', title: '24 hours', desc: 'A full day as a non-smoker.', ms: D },
  { id: 'time-3d', category: 'time', icon: '🔥', title: '3 days', desc: 'Nicotine is clearing out.', ms: 3 * D },
  { id: 'time-7d', category: 'time', icon: '📅', title: '7 days', desc: 'One week smoke-free.', ms: 7 * D },
  { id: 'time-14d', category: 'time', icon: '🛡️', title: '2 weeks', desc: 'Habits are starting to shift.', ms: 14 * D },
  { id: 'time-1mo', category: 'time', icon: '🏅', title: '1 month', desc: 'A major milestone.', ms: MO },
  { id: 'time-2mo', category: 'time', icon: '⭐', title: '2 months', desc: 'Two months of freedom.', ms: 2 * MO },
  { id: 'time-3mo', category: 'time', icon: '💎', title: '3 months', desc: 'Real momentum.', ms: 3 * MO },
  { id: 'time-6mo', category: 'time', icon: '🎯', title: '6 months', desc: 'Half a year smoke-free.', ms: 6 * MO },
  { id: 'time-9mo', category: 'time', icon: '🚀', title: '9 months', desc: 'Nine months strong.', ms: 9 * MO },
  { id: 'time-1y', category: 'time', icon: '🎉', title: '1 year', desc: 'A full year as a non-smoker.', ms: Y },
  { id: 'time-2y', category: 'time', icon: '🏆', title: '2 years', desc: 'Two years smoke-free.', ms: 2 * Y },
  { id: 'time-5y', category: 'time', icon: '👑', title: '5 years', desc: 'Five years — incredible.', ms: 5 * Y },

  // —— Cigarettes avoided (16 waking-hour rate) ——
  { id: 'cigs-1', category: 'cigs', icon: '🚭', title: 'First cigarette', desc: 'One cigarette not smoked.', count: 1 },
  { id: 'cigs-10', category: 'cigs', icon: '🔟', title: '10 avoided', desc: 'Ten cigarettes skipped.', count: 10 },
  { id: 'cigs-first-pack', category: 'cigs', icon: '📦', title: 'First pack', desc: 'A full pack avoided.', packs: 1 },
  { id: 'cigs-50', category: 'cigs', icon: '🌿', title: '50 avoided', desc: 'Fifty cigarettes not smoked.', count: 50 },
  { id: 'cigs-100', category: 'cigs', icon: '💯', title: '100 avoided', desc: 'A hundred cigarettes skipped.', count: 100 },
  { id: 'cigs-5pack', category: 'cigs', icon: '📦', title: '5 packs', desc: 'Five packs avoided.', packs: 5 },
  { id: 'cigs-10pack', category: 'cigs', icon: '🎁', title: '10 packs', desc: 'Ten packs not smoked.', packs: 10 },
  { id: 'cigs-250', category: 'cigs', icon: '🚬', title: '250 avoided', desc: 'Two hundred fifty cigarettes.', count: 250 },
  { id: 'cigs-500', category: 'cigs', icon: '🏔️', title: '500 avoided', desc: 'Five hundred cigarettes skipped.', count: 500 },
  { id: 'cigs-1000', category: 'cigs', icon: '🌟', title: '1,000 avoided', desc: 'A thousand cigarettes avoided.', count: 1000 },
  { id: 'cigs-5000', category: 'cigs', icon: '🔥', title: '5,000 avoided', desc: 'Five thousand — legendary.', count: 5000 },

  // —— Money saved (profile currency) ——
  { id: 'money-10', category: 'money', icon: '💵', title: '10 saved', desc: 'First savings milestone.', amount: 10 },
  { id: 'money-25', category: 'money', icon: '🪙', title: '25 saved', desc: 'Money back in your pocket.', amount: 25 },
  { id: 'money-50', category: 'money', icon: '💰', title: '50 saved', desc: 'Fifty kept.', amount: 50 },
  { id: 'money-100', category: 'money', icon: '💸', title: '100 saved', desc: 'Serious savings.', amount: 100 },
  { id: 'money-250', category: 'money', icon: '🏦', title: '250 saved', desc: 'A quarter grand.', amount: 250 },
  { id: 'money-500', category: 'money', icon: '🎁', title: '500 saved', desc: 'Half a grand kept.', amount: 500 },
  { id: 'money-1000', category: 'money', icon: '💎', title: '1,000 saved', desc: 'Four digits saved.', amount: 1000 },
  { id: 'money-2500', category: 'money', icon: '🏆', title: '2,500 saved', desc: 'Major milestone.', amount: 2500 },
  { id: 'money-5000', category: 'money', icon: '👑', title: '5,000 saved', desc: 'Five thousand saved.', amount: 5000 },
];

export const BADGE_CATEGORIES = [
  { id: 'time', label: 'Time smoke-free', emoji: '⏱️' },
  { id: 'cigs', label: 'Cigarettes avoided', emoji: '🚭' },
  { id: 'money', label: 'Money saved', emoji: '💰' },
];

/** Maps pre–v9 achievement ids to current ids; streak badges removed. */
export const LEGACY_ACHIEVEMENT_IDS = {
  'first-hour': 'time-1h',
  'first-day': 'time-24h',
  'three-days': 'time-3d',
  'one-week': 'time-7d',
  'two-weeks': 'time-14d',
  'one-month': 'time-1mo',
  'three-months': 'time-3mo',
  'six-months': 'time-6mo',
  'one-year': 'time-1y',
  'cigs-100': 'cigs-100',
  'cigs-500': 'cigs-500',
  'cigs-1000': 'cigs-1000',
  'money-25': 'money-25',
  'money-100': 'money-100',
  'money-500': 'money-500',
};

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));

export function defaultState() {
  return {
    version: 3,
    profile: {
      displayName: 'Silvio',
      quitDate: null,
      cigsPerDay: 15,
      cigsPerPack: 20,
      packPrice: 12,
      currency: 'USD',
    },
    seenAchievements: [],
    seenRanks: [],
    achievementUnlocks: {},
    badgeMigrationV9: false,
    seenMilestoneCelebrations: [],
    milestoneAlertsEnabled: false,
    celebrationMigrationV14: false,
  };
}
