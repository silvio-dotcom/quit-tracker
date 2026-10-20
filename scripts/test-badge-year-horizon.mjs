#!/usr/bin/env node
import { achievementsForState, badgeStatuses, badgeEtaMs, estimateUnlockTime } from '../js/achievements.js';
import { BADGE_YEAR_MS } from '../js/badge-year-scale.js';
import { allBadgeTemplateIds } from '../js/achievements-catalog.js';

const MS_D = 24 * 60 * 60 * 1000;

const profiles = [
  { label: '5cpd USD', cigsPerDay: 5, packPrice: 12, currency: 'USD' },
  { label: '20cpd USD', cigsPerDay: 20, packPrice: 12, currency: 'USD' },
  { label: '40cpd USD', cigsPerDay: 40, packPrice: 12, currency: 'USD' },
  { label: '20cpd NIO', cigsPerDay: 20, packPrice: 85, currency: 'NIO' },
];

const now = Date.now();
const quit = new Date(now - MS_D).toISOString();

for (const p of profiles) {
  const state = {
    profile: {
      quitDate: quit,
      cigsPerDay: p.cigsPerDay,
      cigsPerPack: 20,
      packPrice: p.packPrice,
      currency: p.currency,
    },
    achievementUnlocks: {},
  };
  const achievements = achievementsForState(state);
  if (achievements.length !== allBadgeTemplateIds().length) {
    console.error(`${p.label}: expected ${allBadgeTemplateIds().length} badges, got ${achievements.length}`);
    process.exit(1);
  }
  const statuses = badgeStatuses(state, now);
  const quitMs = new Date(quit).getTime();
  for (const s of statuses) {
    const iso = estimateUnlockTime(s.achievement, state);
    if (!iso) {
      console.error(`${p.label}: missing unlock time for ${s.achievement.id}`);
      process.exit(1);
    }
    const unlockMs = new Date(iso).getTime();
    if (unlockMs - quitMs > BADGE_YEAR_MS + 1000) {
      console.error(`${p.label}: ${s.achievement.id} unlock beyond 1 year`);
      process.exit(1);
    }
    const eta = badgeEtaMs(s, state, now);
    if (eta > BADGE_YEAR_MS) {
      console.error(`${p.label}: ETA beyond horizon for ${s.achievement.id}`);
      process.exit(1);
    }
  }
}

console.log('badge year horizon OK');
