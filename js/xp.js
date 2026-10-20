import { msSinceQuit } from './stats.js';
import { unlockedAchievements } from './achievements.js';
import { BADGE_YEAR_MS } from './badge-year-scale.js';

const MS_H = 60 * 60 * 1000;
/** Time XP grows ~linearly early, slower late — pairs with modest badge XP for even pacing. */
const TIME_XP_COEFF = 0.35;
const TIME_XP_POWER = 1.1;
const XP_PER_BADGE = 4;
export const MAX_LEVEL = 20;

export const LEVEL_TITLES = [
  'PUFF DODGER',
  'COIN COLLECTOR',
  'BREATH RUNNER',
  'HABIT HUNTER',
  'LUNG RANGER',
  'QUIT KNIGHT',
  'CHAIN BREAKER',
  'CLEAR SKY',
  'HEALTH HERO',
  'FREEDOM LEGEND',
  'STREAK SAGE',
  'MILESTONE MARIO',
  'BOSS SLAYER',
  'EXTRA LIFE',
  'HIGH SCORE',
  'PIXEL PHOENIX',
  'FINAL BOSS',
  'GAME CLEAR',
  'LEGEND MODE',
  'YEAR CHAMPION',
];

export function totalXp(state, now = Date.now()) {
  if (!state.profile.quitDate) return 0;
  const hours = msSinceQuit(state.profile, now) / MS_H;
  const badges = unlockedAchievements(state, now).length;
  const timeXp = Math.floor(hours ** TIME_XP_POWER * TIME_XP_COEFF);
  const badgeXp = Math.floor(badges * XP_PER_BADGE);
  return timeXp + badgeXp;
}

/** XP cost to advance from `level` to `level + 1` (quick early, slower later). */
export function xpForLevel(level) {
  return Math.round(20 + level * 6 + level * level * 2.2);
}

export function xpToReachLevel(targetLevel) {
  let spent = 0;
  for (let l = 1; l < targetLevel; l++) spent += xpForLevel(l);
  return spent;
}

/** @returns {{ level: number, title: string, into: number, need: number, totalXp: number, maxed: boolean }} */
export function xpLevelProgress(state, now = Date.now()) {
  const total = totalXp(state, now);
  const maxXp = xpToReachLevel(MAX_LEVEL);
  const maxed = total >= maxXp;

  if (maxed) {
    const need = xpForLevel(MAX_LEVEL);
    return {
      level: MAX_LEVEL,
      title: LEVEL_TITLES[MAX_LEVEL - 1] ?? 'MAX',
      into: need,
      need,
      totalXp: total,
      maxed: true,
    };
  }

  let level = 1;
  let spent = 0;
  while (level < MAX_LEVEL && spent + xpForLevel(level) <= total) {
    spent += xpForLevel(level);
    level += 1;
  }
  const into = total - spent;
  const need = xpForLevel(level);
  const title = LEVEL_TITLES[(level - 1) % LEVEL_TITLES.length];
  return { level, title, into, need, totalXp: total, maxed: false };
}

/** Rough sanity: typical 15 cpd profile reaches max level near 1-year horizon. */
export function msToTypicalMaxLevel() {
  return BADGE_YEAR_MS;
}
