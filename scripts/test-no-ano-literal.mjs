#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Misspelled YEAR (YER) must not appear in user-visible chip labels. */
const FORBIDDEN_YER = /\bYER\b/;

function checkChipLabel(label, file) {
  const s = String(label);
  if (FORBIDDEN_YER.test(s) && !/\b1 YR\b/.test(s) && s.includes('YER')) {
    console.error(`${file}: label must use YR not YER: ${s}`);
    process.exit(1);
  }
}

for (const tier of BASE_SMOKE_FREE_CHIPS) {
  checkChipLabel(tier.label, 'constants.js');
  if (tier.id === 'chip-1y' && tier.label !== '1 YR') {
    console.error('chip-1y label must be exactly "1 YR"');
    process.exit(1);
  }
}

const ladderPath = path.join(repo, 'android/app/src/main/assets/widget-chip-ladder.json');
const ladder = JSON.parse(fs.readFileSync(ladderPath, 'utf8'));
for (const row of ladder) {
  checkChipLabel(row.label, 'widget-chip-ladder.json');
  if (row.id === 'chip-1y' && row.label !== '1 YR') {
    console.error('widget ladder chip-1y must be "1 YR"');
    process.exit(1);
  }
}

const scanFiles = [
  'js/share-card.js',
  'scripts/render-widget-mock.mjs',
  'android/app/src/main/java/io/github/silviodotcom/quittracker/WidgetComputer.java',
  'android/app/src/main/java/io/github/silviodotcom/quittracker/WidgetUi.java',
];

for (const rel of scanFiles) {
  const text = fs.readFileSync(path.join(repo, rel), 'utf8');
  const literals = text.match(/"([^"\\]|\\.)*"/g) || [];
  for (const lit of literals) {
    const inner = lit.slice(1, -1);
    if (/\bDÍAS\b|\bDÍA\b|\bAÑO\b|\bSIN HUMO\b|\bSIN MEDALLA\b/.test(inner)) {
      console.error(`${rel}: Spanish literal still present ${lit}`);
      process.exit(1);
    }
    if (/\bYER\b/.test(inner) && !/\b1 YR\b/.test(inner)) {
      console.error(`${rel}: forbidden YER typo in ${lit}`);
      process.exit(1);
    }
  }
}

console.log('no-ano-literal ok');