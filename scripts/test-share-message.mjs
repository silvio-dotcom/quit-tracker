#!/usr/bin/env node
import { buildShareMessage, formatTimeBack } from '../js/share-message.js';
import { TIME_BACK_MINUTES_PER_CIG } from '../js/constants.js';

const now = Date.parse('2026-06-15T12:00:00Z');
const state = {
  profile: {
    quitDate: new Date(now - 28 * 86400000).toISOString(),
    cigsPerDay: 35,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
};

const msg = buildShareMessage(state, now);
if (!msg.startsWith('2026!')) {
  console.error('expected year line');
  process.exit(1);
}
if (!msg.includes('28 días sin fumar')) {
  console.error('expected days line', msg);
  process.exit(1);
}
if (!msg.includes('cigarrillos evitados')) {
  process.exit(1);
}

const tb = formatTimeBack(985, TIME_BACK_MINUTES_PER_CIG);
if (tb !== '4d 2h de mi tiempo recuperado') {
  console.error('time back expected 4d 2h, got', tb);
  process.exit(1);
}

console.log('share message OK');
