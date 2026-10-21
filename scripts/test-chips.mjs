#!/usr/bin/env node
import {
  highestEarnedChip,
  nextChipTarget,
  isChipEarned,
  chipEarnedAtMs,
  allChipTiers,
  isAtMaxChip,
  MAX_CHIP_MS,
} from '../js/chips.js';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;
const CHIP_COUNT = 16;

const EXPECTED_IDS = [
  'chip-24h',
  'chip-2d',
  'chip-3d',
  'chip-4d',
  'chip-5d',
  'chip-6d',
  'chip-1w',
  'chip-2w',
  'chip-3w',
  'chip-1mo',
  'chip-2mo',
  'chip-3mo',
  'chip-4mo',
  'chip-6mo',
  'chip-9mo',
  'chip-1y',
];

const tiers = allChipTiers();
if (tiers.length !== CHIP_COUNT) {
  console.error(`expected ${CHIP_COUNT} chip tiers, got ${tiers.length}`);
  process.exit(1);
}
if (tiers.map((t) => t.id).join(',') !== EXPECTED_IDS.join(',')) {
  console.error('chip ladder ids/order mismatch');
  process.exit(1);
}
if (BASE_SMOKE_FREE_CHIPS.length !== CHIP_COUNT) {
  console.error(`BASE_SMOKE_FREE_CHIPS should have ${CHIP_COUNT} entries`);
  process.exit(1);
}
const last = tiers[tiers.length - 1];
if (last.ms !== MAX_CHIP_MS || last.ms !== 365 * MS_D) {
  console.error('max chip must be 365 days only');
  process.exit(1);
}
if (tiers.some((t) => t.ms > MAX_CHIP_MS)) {
  console.error('no tier beyond 365d');
  process.exit(1);
}

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

const at30h = { profile: { quitDate: new Date(Date.now() - 30 * MS_H).toISOString() } };
const hi30 = highestEarnedChip(at30h, Date.now());
if (!hi30 || hi30.tier.id !== 'chip-24h') {
  console.error('expected 24h chip at 30h');
  process.exit(1);
}
const next30 = nextChipTarget(at30h, Date.now());
if (!next30 || next30.tier.id !== 'chip-2d') {
  console.error('next chip at 30h should be 2d');
  process.exit(1);
}

const at45d = stateAtDays(4.5);
const hi45 = highestEarnedChip(at45d, Date.now());
if (!hi45 || hi45.tier.id !== 'chip-4d') {
  console.error('expected 4-day chip at 4.5 days');
  process.exit(1);
}
const next45 = nextChipTarget(at45d, Date.now());
if (!next45 || next45.tier.id !== 'chip-5d') {
  console.error('next chip at 4.5 days should be 5d');
  process.exit(1);
}

const at24h = { profile: { quitDate: new Date(Date.now() - 24 * MS_H).toISOString() } };
const hi24 = highestEarnedChip(at24h, Date.now());
if (!hi24 || hi24.tier.id !== 'chip-24h') {
  console.error('expected 24h chip at boundary');
  process.exit(1);
}

const at14d = stateAtDays(14);
const hi14 = highestEarnedChip(at14d, Date.now());
if (!hi14 || hi14.tier.id !== 'chip-2w') {
  console.error('expected 2-week chip at 14 days');
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

const at400d = stateAtDays(400);
const hi400 = highestEarnedChip(at400d, Date.now());
if (!hi400 || hi400.tier.id !== 'chip-1y') {
  console.error('expected 1-year chip at 400 days, not extra yearly tiers');
  process.exit(1);
}
if (!isAtMaxChip(at400d, Date.now())) {
  console.error('400d should be max chip state');
  process.exit(1);
}
if (nextChipTarget(at400d, Date.now())) {
  console.error('no next chip after 1 year');
  process.exit(1);
}

if (allChipTiers().some((t) => t.id === 'chip-2y' || t.id === 'chip-3y')) {
  console.error('yearly extension chips must not exist');
  process.exit(1);
}

if (!isChipEarned(quitMs, tier1mo.ms, quitMs + tier1mo.ms)) {
  console.error('boundary inclusive at exact unlock');
  process.exit(1);
}

console.log('chips OK');
