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
  };
}

function expectCigs(hours, cpd, expected, label) {
  const n = cigarettesAvoided(stateWithQuitHoursAgo(hours, cpd));
  if (n !== expected) {
    console.error(`${label}: expected ${expected}, got ${n} (${hours}h @ ${cpd}/day)`);
    process.exit(1);
  }
}

// floor(cigsPerDay × elapsedHours / 24) — waking hours only (16h of each 24h)
expectCigs(26, 15, 16, '26h @ 15/day example');
expectCigs(24, 15, 15, '24h @ 15/day');
expectCigs(22, 12, 11, '22h @ 12/day');

if (WAKING_HOURS_PER_DAY !== 16) {
  console.error('WAKING_HOURS_PER_DAY should be 16');
  process.exit(1);
}
console.log('cigarettesAvoided OK');
