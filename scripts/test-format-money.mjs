#!/usr/bin/env node
import { formatMoney } from '../js/stats.js';

const CURRENCIES = { USD: { symbol: '$' } };

const s = formatMoney(3600, 'USD', CURRENCIES);
if (s !== '$3,600.00') {
  console.error(`expected $3,600.00, got ${s}`);
  process.exit(1);
}

const small = formatMoney(12.5, 'USD', CURRENCIES);
if (small !== '$12.50') {
  console.error(`expected $12.50, got ${small}`);
  process.exit(1);
}

console.log('format money OK');
