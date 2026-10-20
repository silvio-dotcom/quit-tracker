import { TIME_BACK_MINUTES_PER_CIG } from './constants.js';
import {
  TIME_ACHIEVEMENTS,
  CIGS_SPECS,
  MONEY_SPECS,
  TIMEBACK_SPECS,
} from './achievements-catalog.js';
import { cigarettesAvoided, moneySaved, pricePerCig } from './stats.js';

const MS_D = 24 * 60 * 60 * 1000;
export const BADGE_YEAR_MS = 365 * MS_D;

function niceAmount(n, min = 1) {
  if (n < 10) return Math.max(min, Math.round(n));
  const mag = 10 ** Math.floor(Math.log10(n));
  const norm = n / mag;
  const pick = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return Math.max(min, Math.round(pick * mag));
}

function bumpStrict(prev, value, min = 1) {
  let v = Math.max(min, value);
  if (v <= prev) v = prev + 1;
  return v;
}

export function yearHorizonMetrics(profile) {
  const quit = profile.quitDate ? new Date(profile.quitDate).getTime() : Date.now();
  const atYear = quit + BADGE_YEAR_MS;
  const state = { profile };
  const cigs = cigarettesAvoided(state, atYear);
  const money = moneySaved(state, atYear);
  const cpp = Number(profile.cigsPerPack) || 20;
  return {
    cigs,
    money,
    packs: cigs / cpp,
    regainedMinutes: cigs * TIME_BACK_MINUTES_PER_CIG,
  };
}

function buildCigsAchievements(profile, horizon) {
  const cpp = Number(profile.cigsPerPack) || 20;
  let prevCount = 0;
  let prevPacks = 0;
  return CIGS_SPECS.map((spec) => {
    if (spec.packFraction != null) {
      const packs = bumpStrict(prevPacks, niceAmount(horizon.packs * spec.packFraction, 1), 1);
      prevPacks = packs;
      const count = packs * cpp;
      prevCount = Math.max(prevCount, count);
      return {
        id: spec.id,
        category: 'cigs',
        icon: spec.icon,
        title: spec.id === 'cigs-first-pack' ? 'First pack' : spec.title,
        desc: spec.desc,
        packs,
      };
    }
    const raw = horizon.cigs * spec.yearFraction;
    const count = bumpStrict(prevCount, niceAmount(raw, 1), 1);
    prevCount = count;
    const title =
      spec.id === 'cigs-year' ? `${count.toLocaleString()} avoided` : `${count.toLocaleString()} avoided`;
    return {
      id: spec.id,
      category: 'cigs',
      icon: spec.icon,
      title: spec.id === 'cigs-1' ? 'First cigarette' : title,
      desc: spec.desc,
      count,
    };
  });
}

function buildMoneyAchievements(horizon) {
  let prev = 0;
  return MONEY_SPECS.map((spec) => {
    const raw = horizon.money * spec.yearFraction;
    const amount = bumpStrict(prev, niceAmount(raw, 1), 1);
    prev = amount;
    return {
      id: spec.id,
      category: 'money',
      icon: spec.icon,
      title: spec.id === 'money-year' ? 'Year savings' : spec.title,
      desc: spec.desc,
      amount,
    };
  });
}

function buildTimebackAchievements(horizon) {
  let prev = 0;
  return TIMEBACK_SPECS.map((spec) => {
    const raw = horizon.regainedMinutes * spec.yearFraction;
    const regainedMinutes = bumpStrict(prev, niceAmount(raw, 30), 30);
    prev = regainedMinutes;
    return {
      id: spec.id,
      category: 'timeback',
      icon: spec.icon,
      title: spec.title,
      desc: spec.desc,
      regainedMinutes,
    };
  });
}

/** @param {import('./constants.js').profile} profile */
export function buildAchievementsForProfile(profile) {
  const horizon = yearHorizonMetrics(profile);
  return [
    ...TIME_ACHIEVEMENTS,
    ...buildCigsAchievements(profile, horizon),
    ...buildMoneyAchievements(horizon),
    ...buildTimebackAchievements(horizon),
  ];
}

export function maxBadgeHorizonMs(state, now = Date.now()) {
  const quit = state.profile?.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return BADGE_YEAR_MS;
  return Math.max(0, quit + BADGE_YEAR_MS - now);
}
