/** @typedef {'USD'|'EUR'|'GBP'|'CAD'|'AUD'} CurrencyCode */

export const STORAGE_KEY = 'quit-tracker-data-v1';

export const CURRENCIES = {
  USD: { symbol: '$', label: 'US Dollar' },
  EUR: { symbol: '€', label: 'Euro' },
  GBP: { symbol: '£', label: 'British Pound' },
  CAD: { symbol: 'CA$', label: 'Canadian Dollar' },
  AUD: { symbol: 'A$', label: 'Australian Dollar' },
};

export const ACHIEVEMENTS = [
  { id: 'first-hour', type: 'time', ms: 60 * 60 * 1000, title: 'First hour', desc: 'One smoke-free hour.' },
  { id: 'first-day', type: 'time', ms: 24 * 60 * 60 * 1000, title: 'Day one', desc: '24 hours without smoking.' },
  { id: 'three-days', type: 'time', ms: 3 * 24 * 60 * 60 * 1000, title: '72 hours', desc: 'Nicotine largely cleared from your body.' },
  { id: 'one-week', type: 'time', ms: 7 * 24 * 60 * 60 * 1000, title: 'One week', desc: 'A full week smoke-free.' },
  { id: 'two-weeks', type: 'time', ms: 14 * 24 * 60 * 60 * 1000, title: 'Two weeks', desc: 'Habits are shifting.' },
  { id: 'one-month', type: 'time', ms: 30 * 24 * 60 * 60 * 1000, title: 'One month', desc: 'A major milestone.' },
  { id: 'three-months', type: 'time', ms: 90 * 24 * 60 * 60 * 1000, title: 'Three months', desc: 'Real momentum.' },
  { id: 'six-months', type: 'time', ms: 180 * 24 * 60 * 60 * 1000, title: 'Six months', desc: 'Half a year free.' },
  { id: 'one-year', type: 'time', ms: 365 * 24 * 60 * 60 * 1000, title: 'One year', desc: 'A full year as a non-smoker.' },
  { id: 'cigs-100', type: 'cigs', count: 100, title: '100 avoided', desc: '100 cigarettes not smoked.' },
  { id: 'cigs-500', type: 'cigs', count: 500, title: '500 avoided', desc: '500 cigarettes not smoked.' },
  { id: 'cigs-1000', type: 'cigs', count: 1000, title: '1,000 avoided', desc: 'A thousand cigarettes skipped.' },
  { id: 'money-25', type: 'money', amount: 25, title: '$25 saved', desc: 'Money back in your pocket.' },
  { id: 'money-100', type: 'money', amount: 100, title: '$100 saved', desc: 'Serious savings.' },
  { id: 'money-500', type: 'money', amount: 500, title: '$500 saved', desc: 'Half a grand kept.' },
  { id: 'streak-7', type: 'streak', days: 7, title: '7-day streak', desc: 'Seven days on this quit.' },
  { id: 'streak-30', type: 'streak', days: 30, title: '30-day streak', desc: 'Thirty days on this quit.' },
];

export function defaultState() {
  return {
    version: 2,
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
  };
}
