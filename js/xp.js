import { msSinceQuit } from './stats.js';
import { unlockedAchievements } from './achievements.js';

const MS_H = 60 * 60 * 1000;
const XP_PER_HOUR = 8;
const XP_PER_BADGE = 100;

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
  return level * 120;
}

/** @returns {{ level: number, title: string, into: number, need: number, totalXp: number }} */
export function xpLevelProgress(state, now = Date.now()) {
  const total = totalXp(state, now);
  let level = 1;
  let spent = 0;
  while (spent + xpForLevel(level) <= total) {
    spent += xpForLevel(level);
    level += 1;
  }
  const into = total - spent;
  const need = xpForLevel(level);
  const title = LEVEL_TITLES[(level - 1) % LEVEL_TITLES.length];
  return { level, title, into, need, totalXp: total };
}
