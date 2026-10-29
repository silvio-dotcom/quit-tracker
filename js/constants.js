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
    label: '24 H',
    shortLabel: '24 h',
    notifyLabel: 'medalla de 24 horas',
    ms: 24 * CHIP_H,
    kind: 'chip',
    palette: { inner: ['#f8fafc', '#cbd5e1'], rim: '#94a3b8', text: '#0f172a' },
  },
  {
    id: 'chip-2d',
    label: '2 DÍAS',
    shortLabel: '2 d',
    notifyLabel: 'medalla de 2 días',
    ms: 2 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#a5f3fc', '#06b6d4'], rim: '#0e7490', text: '#164e63' },
  },
  {
    id: 'chip-3d',
    label: '3 DÍAS',
    shortLabel: '3 d',
    notifyLabel: 'medalla de 3 días',
    ms: 3 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#e8b88a', '#b87333'], rim: '#8b5a2b', text: '#3f1f0f' },
  },
  {
    id: 'chip-4d',
    label: '4 DÍAS',
    shortLabel: '4 d',
    notifyLabel: 'medalla de 4 días',
    ms: 4 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#ddd6fe', '#7c3aed'], rim: '#5b21b6', text: '#2e1065' },
  },
  {
    id: 'chip-5d',
    label: '5 DÍAS',
    shortLabel: '5 d',
    notifyLabel: 'medalla de 5 días',
    ms: 5 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fef08a', '#eab308'], rim: '#a16207', text: '#422006' },
  },
  {
    id: 'chip-6d',
    label: '6 DÍAS',
    shortLabel: '6 d',
    notifyLabel: 'medalla de 6 días',
    ms: 6 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fbcfe8', '#ec4899'], rim: '#be185d', text: '#500724' },
  },
  {
    id: 'chip-1w',
    label: '1 SEM',
    shortLabel: '1 sem',
    notifyLabel: 'medalla de 1 semana',
    ms: 7 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fca5a5', '#dc2626'], rim: '#991b1b', text: '#450a0a' },
  },
  {
    id: 'chip-2w',
    label: '2 SEM',
    shortLabel: '2 sem',
    notifyLabel: 'medalla de 2 semanas',
    ms: 14 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#f9a8d4', '#db2777'], rim: '#9d174d', text: '#500724' },
  },
  {
    id: 'chip-3w',
    label: '3 SEM',
    shortLabel: '3 sem',
    notifyLabel: 'medalla de 3 semanas',
    ms: 21 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fdba74', '#ea580c'], rim: '#c2410c', text: '#431407' },
  },
  {
    id: 'chip-1mo',
    label: '1 MES',
    shortLabel: '1 mes',
    notifyLabel: 'medalla de 1 mes',
    ms: 30 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#fde68a', '#f59e0b'], rim: '#b45309', text: '#451a03' },
  },
  {
    id: 'chip-2mo',
    label: '2 MESES',
    shortLabel: '2 mes',
    notifyLabel: 'medalla de 2 meses',
    ms: 60 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#5eead4', '#14b8a6'], rim: '#0f766e', text: '#134e4a' },
  },
  {
    id: 'chip-3mo',
    label: '3 MESES',
    shortLabel: '3 mes',
    notifyLabel: 'medalla de 3 meses',
    ms: 90 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#86efac', '#22c55e'], rim: '#15803d', text: '#052e16' },
  },
  {
    id: 'chip-4mo',
    label: '4 MESES',
    shortLabel: '4 mes',
    notifyLabel: 'medalla de 4 meses',
    ms: 120 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#bef264', '#22d3ee'], rim: '#0891b2', text: '#164e63' },
  },
  {
    id: 'chip-6mo',
    label: '6 MESES',
    shortLabel: '6 mes',
    notifyLabel: 'medalla de 6 meses',
    ms: 182 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#93c5fd', '#3b82f6'], rim: '#1d4ed8', text: '#1e3a8a' },
  },
  {
    id: 'chip-9mo',
    label: '9 MESES',
    shortLabel: '9 mes',
    notifyLabel: 'medalla de 9 meses',
    ms: 273 * CHIP_D,
    kind: 'chip',
    palette: { inner: ['#d8b4fe', '#a855f7'], rim: '#6b21a8', text: '#3b0764' },
  },
  {
    id: 'chip-1y',
    label: '1 AÑO',
    shortLabel: '1 año',
    notifyLabel: 'medalla estrella de 1 año',
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
  USD: { symbol: '$', label: 'Dólar estadounidense' },
  NIO: { symbol: 'C$', label: 'Córdoba nicaragüense' },
  EUR: { symbol: '€', label: 'Euro' },
  GBP: { symbol: '£', label: 'Libra esterlina' },
  CAD: { symbol: 'CA$', label: 'Dólar canadiense' },
  AUD: { symbol: 'A$', label: 'Dólar australiano' },
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
  { id: 'time', label: 'Tiempo', emoji: '⏱️' },
  { id: 'cigs', label: 'Cigarrillos', emoji: '🚭' },
  { id: 'money', label: 'Dinero', emoji: '💰' },
  { id: 'timeback', label: 'Tiempo ganado', emoji: '⏳' },
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
