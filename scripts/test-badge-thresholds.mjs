#!/usr/bin/env node
import { buildAchievementsForProfile, scaledThresholdLists } from '../js/badge-year-scale.js';
import { allBadgeTemplateIds } from '../js/achievements-catalog.js';
import { achievementsForState, estimateUnlockTime } from '../js/achievements.js';

const MIN_RATIO = 1.2;
const MS_D = 86400000;

const profiles = [
  { label: '5cpd USD', cigsPerDay: 5, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { label: '20cpd USD', cigsPerDay: 20, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { label: '40cpd USD', cigsPerDay: 40, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { label: '20cpd NIO', cigsPerDay: 20, cigsPerPack: 20, packPrice: 85, currency: 'NIO' },
];

function assertStrictIncreasing(label, values, key) {
  if (values.length < 2) return;
  const seen = new Set();
  for (const v of values) {
    if (seen.has(v)) {
      console.error(`${label}: duplicate ${key} threshold ${v}`);
      process.exit(1);
    }
    seen.add(v);
  }
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) {
      console.error(`${label}: ${key} not strictly increasing at ${i}: ${values[i - 1]} -> ${values[i]}`);
      process.exit(1);
    }
  }
  const interior = values.slice(0, -1);
  const yearCap = values[values.length - 1];
  const stepRatio = (yearCap / interior[0]) ** (1 / interior.length);
  if (stepRatio < 1.12) {
    console.error(`${label}: ${key} overall spread too flat (${stepRatio.toFixed(3)}x per step)`);
    process.exit(1);
  }
  if (yearCap < interior[interior.length - 1] * MIN_RATIO - 0.01) {
    console.error(`${label}: ${key} year cap too close to last interior`);
    process.exit(1);
  }
}

const quit = new Date(Date.now() - MS_D).toISOString();

for (const p of profiles) {
  const profile = { quitDate: quit, ...p };
  const achievements = buildAchievementsForProfile(profile);
  if (achievements.length !== allBadgeTemplateIds().length) {
    console.error(`${p.label}: badge count ${achievements.length} vs ${allBadgeTemplateIds().length}`);
    process.exit(1);
  }

  const { money, cigs, timeback } = scaledThresholdLists(profile);
  assertStrictIncreasing(p.label, money, 'money');
  assertStrictIncreasing(p.label, cigs, 'cigs');
  assertStrictIncreasing(p.label, timeback, 'timeback');

  const state = { profile, achievementUnlocks: {} };
  const list = achievementsForState(state);
  const moneyYear = list.find((a) => a.id === 'money-year');
  const quitMs = new Date(quit).getTime();
  const yearIso = estimateUnlockTime(moneyYear, state);
  const yearMs = new Date(yearIso).getTime() - quitMs;
  if (yearMs < 360 * MS_D || yearMs > 366 * MS_D) {
    console.error(`${p.label}: money-year unlock at ${yearMs / MS_D}d, expected ~365d`);
    process.exit(1);
  }

  for (const a of list.filter((x) => x.category === 'money')) {
    if (a.desc.toLowerCase().includes('four digits')) {
      console.error(`${p.label}: stale money description on ${a.id}`);
      process.exit(1);
    }
    if (a.desc.toLowerCase().includes('thousand') && !a.desc.includes(String(a.amount).slice(0, 1))) {
      console.error(`${p.label}: stale cigs-style copy on ${a.id}`);
      process.exit(1);
    }
  }
}

console.log('badge thresholds OK');
