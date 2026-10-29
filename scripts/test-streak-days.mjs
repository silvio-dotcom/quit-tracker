#!/usr/bin/env node
import { currentStreakDays, formatStreakDisplay } from '../js/stats.js';

const TZ = 'America/Managua';
const H = 60 * 60 * 1000;
const D = 24 * H;

const prev = process.env.TZ;
process.env.TZ = TZ;

function stateAt(quitIso) {
  return { profile: { quitDate: quitIso } };
}

function assertDays(quitIso, nowMs, expected, label) {
  const got = currentStreakDays(stateAt(quitIso), nowMs);
  if (got !== expected) {
    throw new Error(`${label}: expected ${expected} days, got ${got}`);
  }
}

try {
  const quit = new Date('2026-10-19T20:00:00');
  const quitIso = quit.toISOString();

  assertDays(quitIso, quit.getTime(), 0, '0s');
  assertDays(quitIso, quit.getTime() + 20 * H, 0, '20h');
  assertDays(quitIso, quit.getTime() + D, 1, '24h');
  assertDays(quitIso, quit.getTime() + 47 * H, 1, '47h');
  assertDays(quitIso, quit.getTime() + 48 * H, 2, '48h');

  // Calendar midnight cross: still 24h-based, not calendar days
  const eve = new Date('2026-10-19T23:30:00');
  const eveIso = eve.toISOString();
  assertDays(eveIso, eve.getTime() + 23 * H, 0, 'eve+23h');
  assertDays(eveIso, eve.getTime() + 25 * H, 1, 'eve+25h');

  const display20h = formatStreakDisplay(stateAt(quitIso), quit.getTime() + 20 * H);
  if (!display20h.includes('20') || !display20h.includes('hora')) {
    throw new Error(`formatStreakDisplay 20h: got "${display20h}"`);
  }
  const display0 = formatStreakDisplay(stateAt(quitIso), quit.getTime() + 30 * 1000);
  if (display0 !== '0 días') throw new Error(`formatStreakDisplay 30s: got "${display0}"`);

  console.log('streak day tests OK (TZ=%s)', TZ);
} finally {
  if (prev === undefined) delete process.env.TZ;
  else process.env.TZ = prev;
}
