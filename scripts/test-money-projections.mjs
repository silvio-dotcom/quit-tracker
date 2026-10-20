#!/usr/bin/env node
import { projectedMoneySaved } from '../js/stats.js';

const state = {
  profile: { cigsPerDay: 20, cigsPerPack: 20, packPrice: 10, currency: 'USD' },
};

const month = projectedMoneySaved(state, 30);
if (Math.abs(month - 300) > 0.01) {
  console.error(`expected 300 for 30d @ 20/day $0.50/cig, got ${month}`);
  process.exit(1);
}
console.log('money projections OK');
