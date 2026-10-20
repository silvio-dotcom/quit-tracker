#!/usr/bin/env node
import { xpLevelProgress } from '../js/xp.js';
import { syncAchievementUnlocks } from '../js/achievements.js';

const MS_D = 86400000;
const profile = { cigsPerDay: 15, cigsPerPack: 20, packPrice: 12, currency: 'USD' };

function levelAt(days) {
  const state = {
    profile: { ...profile, quitDate: new Date(Date.now() - days * MS_D).toISOString() },
    achievementUnlocks: {},
  };
  syncAchievementUnlocks(state, Date.now());
  return xpLevelProgress(state, Date.now()).level;
}

const checks = [
  [7, 4, 6],
  [30, 7, 9],
  [90, 10, 13],
  [180, 14, 16],
  [365, 20, 20],
];

for (const [days, min, max] of checks) {
  const lv = levelAt(days);
  if (lv < min || lv > max) {
    console.error(`XP pacing: ${days}d level ${lv} outside [${min}, ${max}]`);
    process.exit(1);
  }
}

console.log('xp pacing OK');
