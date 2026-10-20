#!/usr/bin/env node
import { cigarettesAvoided, WAKING_HOURS_PER_DAY } from '../js/stats.js';

const MS_PER_HOUR = 60 * 60 * 1000;

function stateWithQuitHoursAgo(hours, cigsPerDay) {
  const now = Date.now();
  return {
    profile: {
      quitDate: new Date(now - hours * MS_PER_HOUR).toISOString(),
      cigsPerDay,
      cigsPerPack: 20,
      packPrice: 12,
      currency: 'USD',
    },
    personalBestStreak: 0,
  };
}

const state = stateWithQuitHoursAgo(22, 12);
const n = cigarettesAvoided(state);
if (n !== 16) {
  console.error(`Expected 16 cigarettes (12/day, 22h), got ${n}`);
  process.exit(1);
}
if (WAKING_HOURS_PER_DAY !== 16) {
  console.error('WAKING_HOURS_PER_DAY should be 16');
  process.exit(1);
}
console.log('cigarettesAvoided OK:', n);
