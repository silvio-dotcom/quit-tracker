#!/usr/bin/env node
import {
  highestEarnedChip,
  nextChipTarget,
  isChipEarned,
  chipEarnedAtMs,
  allChipTiers,
} from '../js/chips.js';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

function stateAtDays(days) {
  const now = Date.now();
  const quit = new Date(now - days * MS_D).toISOString();
  return { profile: { quitDate: quit } };
}

const justUnder24h = stateAtDays(0);
justUnder24h.profile.quitDate = new Date(Date.now() - 23 * MS_H).toISOString();
const hiUnder = highestEarnedChip(justUnder24h, Date.now());
if (hiUnder) {
  console.error('expected no chip before 24h');
  process.exit(1);
}
const next = nextChipTarget(justUnder24h, Date.now());
if (!next || next.tier.id !== 'chip-24h') {
  console.error('next chip should be 24h');
  process.exit(1);
}
if (next.progress <= 0 || next.progress >= 100) {
  console.error('progress should be between 0 and 100 at 23h');
  process.exit(1);
}

const at24h = { profile: { quitDate: new Date(Date.now() - 24 * MS_H).toISOString() } };
const hi24 = highestEarnedChip(at24h, Date.now());
if (!hi24 || hi24.tier.id !== 'chip-24h') {
  console.error('expected 24h chip at boundary');
  process.exit(1);
}

const at1mo = stateAtDays(30);
const hi1mo = highestEarnedChip(at1mo, Date.now());
if (!hi1mo || hi1mo.tier.id !== 'chip-1mo') {
  console.error('expected 1-month chip at 30 days');
  process.exit(1);
}

const quitMs = new Date(at1mo.profile.quitDate).getTime();
const tier1mo = BASE_SMOKE_FREE_CHIPS.find((t) => t.id === 'chip-1mo');
const earnedAt = chipEarnedAtMs(quitMs, tier1mo.ms);
if (Math.abs(earnedAt - (quitMs + 30 * MS_D)) > 1000) {
  console.error('earned date should be quit + duration');
  process.exit(1);
}

const at29d = stateAtDays(29.9);
const hi29 = highestEarnedChip(at29d, Date.now());
if (hi29 && hi29.tier.id === 'chip-1mo') {
  console.error('1-month chip should not unlock before 30 days');
  process.exit(1);
}

const at3d = { profile: { quitDate: new Date(Date.now() - 3 * MS_D).toISOString() } };
const hi3d = highestEarnedChip(at3d, Date.now());
if (!hi3d || hi3d.tier.id !== 'chip-3d') {
  console.error('expected 3-day chip at 3 days');
  process.exit(1);
}

const at2y = stateAtDays(365 * 2);
const hi2y = highestEarnedChip(at2y, Date.now());
if (!hi2y || hi2y.tier.id !== 'chip-2y') {
  console.error('expected 2-year medallion at 2 years');
  process.exit(1);
}

const tiers = allChipTiers(Date.now(), at2y.profile.quitDate);
if (!tiers.some((t) => t.id === 'chip-2y')) {
  console.error('tier list should include 2y');
  process.exit(1);
}

if (!isChipEarned(quitMs, tier1mo.ms, quitMs + tier1mo.ms)) {
  console.error('boundary inclusive at exact unlock');
  process.exit(1);
}

console.log('chips OK');
