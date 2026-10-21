/** @typedef {'USD'|'NIO'|'EUR'|'GBP'|'CAD'|'AUD'} CurrencyCode */

export const STORAGE_KEY = 'quit-tracker-data-v1';

/** Minutes of life regained per cigarette not smoked (share / time-back). */
export const TIME_BACK_MINUTES_PER_CIG = 6;

const CHIP_H = 60 * 60 * 1000;
const CHIP_D = 24 * CHIP_H;

/**
 * Smoke-free chip tiers (original design; not AA-affiliated).
 * @type {Array<{ id: string, label: string, shortLabel: string, notifyLabel: string, ms: number, kind: 'chip'|'medallion', palette: { inner: [string,string], rim: string, text: string } }>}
 */
export const BASE_SMOKE_FREE_CHIPS = [
  {
    id: 'chip-24h',
    label: '24 HRS',
    shortLabel: '24h',
    notifyLabel: '24-hour chip',
    ms: 24 * CHIP_H,
    kind: 'chip',
    palette: { inner: ['#f8fafc', '#cbd5e1'], rim: '#94a3b8', text: '#0f172a' },
  },
  {
    id: 'chip-2d',
    label: '2 DAYS',
    shortLabel: '2d',
    notifyLabel: '2-day chip',
    ms: 2 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#a5f3fc', '#06b6d4'], rim: '#0e7490', text: '#164e63' },
  },
  {
    id: 'chip-3d',
    label: '3 DAYS',
    shortLabel: '3d',
    notifyLabel: '3-day chip',
    ms: 3 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#e8b88a', '#b87333'], rim: '#8b5a2b', text: '#3f1f0f' },
  },
  {
    id: 'chip-4d',
    label: '4 DAYS',
    shortLabel: '4d',
    notifyLabel: '4-day chip',
    ms: 4 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#ddd6fe', '#7c3aed'], rim: '#5b21b6', text: '#2e1065' },
  },
  {
    id: 'chip-5d',
    label: '5 DAYS',
    shortLabel: '5d',
    notifyLabel: '5-day chip',
    ms: 5 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fef08a', '#eab308'], rim: '#a16207', text: '#422006' },
  },
  {
    id: 'chip-6d',
    label: '6 DAYS',
    shortLabel: '6d',
    notifyLabel: '6-day chip',
    ms: 6 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fbcfe8', '#ec4899'], rim: '#be185d', text: '#500724' },
  },
  {
    id: 'chip-1w',
    label: '1 WEEK',
    shortLabel: '1 wk',
    notifyLabel: '1-week chip',
    ms: 7 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fca5a5', '#dc2626'], rim: '#991b1b', text: '#450a0a' },
  },
  {
    id: 'chip-2w',
    label: '2 WEEKS',
    shortLabel: '2 wk',
    notifyLabel: '2-week chip',
    ms: 14 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#f9a8d4', '#db2777'], rim: '#9d174d', text: '#500724' },
  },
  {
    id: 'chip-3w',
    label: '3 WEEKS',
    shortLabel: '3 wk',
    notifyLabel: '3-week chip',
    ms: 21 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fdba74', '#ea580c'], rim: '#c2410c', text: '#431407' },
  },
  {
    id: 'chip-1mo',
    label: '1 MONTH',
    shortLabel: '1 mo',
    notifyLabel: '1-month chip',
    ms: 30 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fde68a', '#f59e0b'], rim: '#b45309', text: '#451a03' },
  },
  {
    id: 'chip-2mo',
    label: '2 MONTHS',
    shortLabel: '2 mo',
    notifyLabel: '2-month chip',
    ms: 60 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#5eead4', '#14b8a6'], rim: '#0f766e', text: '#134e4a' },
  },
  {
    id: 'chip-3mo',
    label: '3 MONTHS',
    shortLabel: '3 mo',
    notifyLabel: '3-month chip',
    ms: 90 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#86efac', '#22c55e'], rim: '#15803d', text: '#052e16' },
  },
  {
    id: 'chip-4mo',
    label: '4 MONTHS',
    shortLabel: '4 mo',
    notifyLabel: '4-month chip',
    ms: 120 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#bef264', '#22d3ee'], rim: '#0891b2', text: '#164e63' },
  },
  {
    id: 'chip-6mo',
    label: '6 MONTHS',
    shortLabel: '6 mo',
    notifyLabel: '6-month chip',
    ms: 182 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#93c5fd', '#3b82f6'], rim: '#1d4ed8', text: '#1e3a8a' },
  },
  {
    id: 'chip-9mo',
    label: '9 MONTHS',
    shortLabel: '9 mo',
    notifyLabel: '9-month chip',
    ms: 273 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#d8b4fe', '#a855f7'], rim: '#6b21a8', text: '#3b0764' },
  },
  {
    id: 'chip-1y',
    label: '1 YEAR',
    shortLabel: '1 yr',
    notifyLabel: '1-year star chip',
    ms: 365 * CHIP_D,
    kind: 'medallion',
    palette: { inner: ['#e8c49a', '#cd7f32'], rim: '#8b4513', text: '#3f220f' },
  },
];

/** Final smoke-free chip tier (1 year); no yearly extensions beyond this. */
export const MAX_CHIP_TIER = BASE_SMOKE_FREE_CHIPS[BASE_SMOKE_FREE_CHIPS.length - 1];
export const MAX_CHIP_MS = MAX_CHIP_TIER.ms;

export const BRONZE_MEDALLION_PALETTE = {
  inner: ['#e8c49a', '#cd7f32'],
  rim: '#8b4513',
  text: '#3f220f',
};

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

/** @typedef {'time'|'cigs'|'money'|'timeback'} BadgeCategoryId */

import { allBadgeTemplateIds } from './achievements-catalog.js';
import { buildAchievementsForProfile } from './badge-year-scale.js';

const DEFAULT_BADGE_PROFILE = {
  quitDate: new Date(0).toISOString(),
  cigsPerDay: 15,
  cigsPerPack: 20,
  packPrice: 12,
  currency: 'USD',
};

export const ACHIEVEMENTS = buildAchievementsForProfile(DEFAULT_BADGE_PROFILE);

export const BADGE_CATEGORIES = [
  { id: 'time', label: 'Time', emoji: '⏱️' },
  { id: 'cigs', label: 'Cigarettes', emoji: '🚭' },
  { id: 'money', label: 'Money', emoji: '💰' },
  { id: 'timeback', label: 'Time back', emoji: '⏳' },
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

export const ACHIEVEMENT_IDS = new Set(allBadgeTemplateIds());

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
    chipCelebrationMigrationV17: false,
  };
}
