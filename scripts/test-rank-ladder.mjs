#!/usr/bin/env node
import { RANK_LADDER, MAX_RANK_MS, getNextRank, progressToNextRank, rankMetrics } from '../js/ranks.js';

const Y = 365 * 24 * 60 * 60 * 1000;

if (RANK_LADDER.some((r) => r.smokeFreeMs > MAX_RANK_MS)) {
  console.error('rank ladder exceeds 1 year');
  process.exit(1);
}

const last = RANK_LADDER[RANK_LADDER.length - 1];
if (last.smokeFreeMs !== Y) {
  console.error('final rank must be at 365 days');
  process.exit(1);
}

if (RANK_LADDER.some((r) => r.id === 'immortal')) {
  console.error('immortal rank should be removed');
  process.exit(1);
}

for (let i = 1; i < RANK_LADDER.length; i++) {
  if (RANK_LADDER[i].smokeFreeMs <= RANK_LADDER[i - 1].smokeFreeMs) {
    console.error('rank ladder not strictly increasing');
    process.exit(1);
  }
}

const state = {
  profile: { quitDate: new Date(Date.now() - 400 * 86400000).toISOString(), cigsPerDay: 15 },
};
const metrics = rankMetrics(state, Date.now());
if (getNextRank(metrics) !== null) {
  console.error('expected max rank after 400d');
  process.exit(1);
}
if (progressToNextRank(metrics) !== 100) {
  console.error('expected 100% at max rank');
  process.exit(1);
}

console.log('rank ladder OK');
