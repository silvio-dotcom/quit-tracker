#!/usr/bin/env node
import { buildAchievementsForProfile, formatTimebackLabel } from '../js/badge-year-scale.js';
import { badgeDisplayTitle } from '../js/achievements.js';

const profiles = [
  { cigsPerDay: 5, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { cigsPerDay: 20, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { cigsPerDay: 40, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
];

const quit = new Date(Date.now() - 86400000).toISOString();
const YEAR_BACK = /year back/i;
const MONTH_BACK = /month back/i;

for (const p of profiles) {
  const profile = { quitDate: quit, ...p };
  const list = buildAchievementsForProfile(profile).filter((a) => a.category === 'timeback');
  for (const a of list) {
    const title = badgeDisplayTitle(a, profile.currency);
    const label = formatTimebackLabel(a.regainedMinutes);
    if (YEAR_BACK.test(title)) {
      console.error(`${p.cigsPerDay}cpd: ${a.id} must not use "year back" (got "${title}")`);
      process.exit(1);
    }
    if (MONTH_BACK.test(title) && a.regainedMinutes < 43200) {
      console.error(`${p.cigsPerDay}cpd: ${a.id} month title exceeds threshold minutes`);
      process.exit(1);
    }
    if (!title.includes(label.text)) {
      console.error(`${p.cigsPerDay}cpd: ${a.id} title "${title}" missing label "${label.text}"`);
      process.exit(1);
    }
    const dayMatch = title.match(/(\d+)\s*day/);
    if (dayMatch) {
      const titledDays = Number(dayMatch[1]);
      const maxDays = Math.ceil(a.regainedMinutes / 1440);
      if (titledDays > maxDays + 1) {
        console.error(`${p.cigsPerDay}cpd: ${a.id} title days exceed threshold`);
        process.exit(1);
      }
    }
  }
}

console.log('timeback titles OK');
