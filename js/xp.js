import { msSinceQuit } from './stats.js';
import { unlockedAchievements } from './achievements.js';

const MS_H = 60 * 60 * 1000;
const XP_PER_HOUR = 0.14;
const XP_PER_BADGE = 40;
export const MAX_LEVEL = 10;

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
];

export function totalXp(state, now = Date.now()) {
  if (!state.profile.quitDate) return 0;
  const hours = msSinceQuit(state.profile, now) / MS_H;
  const badges = unlockedAchievements(state, now).length;
  return Math.floor(hours * XP_PER_HOUR + badges * XP_PER_BADGE);
}

export function xpForLevel(level) {
  return level * 85;
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
      title: 'MAX',
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
