#!/usr/bin/env node
import { allBadgeTemplateIds } from '../js/achievements-catalog.js';
import {
  achievementsForState,
  badgeStatuses,
  selectNextLockedBadge,
  sortEarnedBadgesNewest,
  sortLockedBadgesByEta,
  badgeEtaMs,
  badgeUnlockIso,
} from '../js/achievements.js';
import { totalXp, xpLevelProgress, xpForLevel } from '../js/xp.js';

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

const state1d = {
  profile: {
    quitDate: new Date(Date.now() - 26 * MS_H).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  achievementUnlocks: {},
};

const achievements = achievementsForState(state1d);
const statuses = badgeStatuses(state1d, Date.now());
if (statuses.length !== achievements.length) {
  console.error('badge status count mismatch');
  process.exit(1);
}

if (achievements.length < 50) {
  console.error('expected at least 50 badges');
  process.exit(1);
}

const next = selectNextLockedBadge(statuses, state1d, Date.now(), 'all');
if (!next || next.unlocked) {
  console.error('expected locked next badge');
  process.exit(1);
}

const locked = sortLockedBadgesByEta(statuses.filter((s) => !s.unlocked), state1d, Date.now());
if (locked[0].achievement.id !== next.achievement.id) {
  console.error('next badge should match closest ETA');
  process.exit(1);
}

const earned = statuses.filter((s) => s.unlocked);
const sortedEarned = sortEarnedBadgesNewest(earned, state1d);
for (let i = 1; i < sortedEarned.length; i++) {
  const prev = new Date(badgeUnlockIso(sortedEarned[i - 1], state1d) || 0).getTime();
  const cur = new Date(badgeUnlockIso(sortedEarned[i], state1d) || 0).getTime();
  if (prev < cur) {
    console.error('earned badges should be newest first');
    process.exit(1);
  }
}

for (let i = 1; i < locked.length; i++) {
  const a = badgeEtaMs(locked[i - 1], state1d, Date.now());
  const b = badgeEtaMs(locked[i], state1d, Date.now());
  if (a > b) {
    console.error('locked badges should sort by ascending ETA');
    process.exit(1);
  }
}

const xp = totalXp(state1d, Date.now());
const prog = xpLevelProgress(state1d, Date.now());
if (prog.level < 1 || prog.into < 0 || prog.need !== xpForLevel(prog.level)) {
  console.error('xp level progress invalid');
  process.exit(1);
}
if (xp < 0) process.exit(1);

console.log('badge gamify OK', achievements.length, 'badges');
