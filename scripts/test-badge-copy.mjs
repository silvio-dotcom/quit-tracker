#!/usr/bin/env node
import {
  buildAchievementsForProfile,
  formatTimebackLabel,
  timebackTitle,
  timebackDesc,
  moneyTitle,
  cigsTitle,
  cigsPackTitle,
} from '../js/badge-year-scale.js';
import { moneyBadgeTitle } from '../js/achievements.js';

const profiles = [
  { label: '5cpd USD', cigsPerDay: 5, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { label: '20cpd USD', cigsPerDay: 20, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
  { label: '40cpd USD', cigsPerDay: 40, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
];

const quit = new Date(Date.now() - 86400000).toISOString();

function digitsIn(text) {
  return (text.match(/\d[\d,]*/g) || []).map((s) => Number(s.replace(/,/g, '')));
}

function assertMoneyCopy(p, a) {
  const isYear = a.id === 'money-year';
  const wantTitle = moneyTitle(a.amount, isYear);
  if (a.title !== wantTitle) {
    console.error(`${p.label}: ${a.id} title "${a.title}" expected "${wantTitle}"`);
    process.exit(1);
  }
  const display = moneyBadgeTitle(a, p.currency);
  if (!display.includes(String(a.amount)) && !display.includes(a.amount.toLocaleString())) {
    console.error(`${p.label}: ${a.id} display title missing amount ${a.amount}`);
    process.exit(1);
  }
  const nums = digitsIn(a.desc);
  if (!nums.includes(a.amount)) {
    console.error(`${p.label}: ${a.id} desc missing amount ${a.amount}: ${a.desc}`);
    process.exit(1);
  }
}

function assertTimebackCopy(p, a) {
  const isYear = a.id === 'timeback-year';
  const wantTitle = timebackTitle(a.regainedMinutes, isYear);
  const wantDesc = timebackDesc(a.regainedMinutes, isYear);
  if (a.title !== wantTitle) {
    console.error(`${p.label}: ${a.id} title "${a.title}" expected "${wantTitle}"`);
    process.exit(1);
  }
  if (a.desc !== wantDesc) {
    console.error(`${p.label}: ${a.id} desc mismatch`);
    process.exit(1);
  }
  const label = formatTimebackLabel(a.regainedMinutes).text;
  if (!a.title.includes(label) || !a.desc.includes(label)) {
    console.error(`${p.label}: ${a.id} title/desc must include "${label}"`);
    process.exit(1);
  }
  if (isYear && !a.desc.includes('primer año')) {
    console.error(`${p.label}: ${a.id} year desc must mention first year`);
    process.exit(1);
  }
  if (/año recuperados/i.test(a.title)) {
    console.error(`${p.label}: ${a.id} must not say year back`);
    process.exit(1);
  }
}

function assertCigsCopy(p, a) {
  const cpp = p.cigsPerPack || 20;
  if (a.packs != null) {
    const want = cigsPackTitle(a.packs, a.id);
    if (a.title !== want) {
      console.error(`${p.label}: ${a.id} pack title "${a.title}" expected "${want}"`);
      process.exit(1);
    }
    const equiv = a.packs * cpp;
    const nums = digitsIn(a.desc);
    if (!nums.includes(a.packs) && !nums.includes(equiv)) {
      console.error(`${p.label}: ${a.id} pack desc missing pack count`);
      process.exit(1);
    }
    return;
  }
  const want = cigsTitle(a.count, a.id);
  if (a.title !== want) {
    console.error(`${p.label}: ${a.id} title "${a.title}" expected "${want}"`);
    process.exit(1);
  }
  const nums = digitsIn(a.desc);
  if (!nums.includes(a.count)) {
    console.error(`${p.label}: ${a.id} desc missing count ${a.count}`);
    process.exit(1);
  }
}

for (const row of profiles) {
  const profile = { quitDate: quit, ...row };
  const list = buildAchievementsForProfile(profile);
  for (const a of list) {
    if (a.category === 'money') assertMoneyCopy(profile, a);
    if (a.category === 'timeback') assertTimebackCopy(profile, a);
    if (a.category === 'cigs') assertCigsCopy(profile, a);
  }
}

console.log('badge copy OK');
