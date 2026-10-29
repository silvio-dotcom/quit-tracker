#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Standalone ANO (no tilde) — must never appear in user-visible copy. */
const STANDALONE_ANO = /(?:^|[^Ññ])ANO(?:$|[^A-ZÁÉÍÓÚÑa-záéíóúñ])/;

const UNACCENTED_DIAS = /\bDIAS\b/;

function checkString(label, value, file) {
  const s = String(value);
  if (s === 'ANO' || /\bANO\b/.test(s.replace(/AÑO/g, ''))) {
    if (/\bANO\b/.test(s) && !s.includes('AÑO')) {
      console.error(`${file}: "${label}" contains forbidden ANO: ${s}`);
      process.exit(1);
    }
  }
  if (STANDALONE_ANO.test(s)) {
    console.error(`${file}: "${label}" looks like standalone ANO: ${s}`);
    process.exit(1);
  }
  if (UNACCENTED_DIAS.test(s)) {
    console.error(`${file}: "${label}" must use DÍAS not DIAS: ${s}`);
    process.exit(1);
  }
}

for (const tier of BASE_SMOKE_FREE_CHIPS) {
  checkString(tier.id, tier.label, 'constants.js');
  if (tier.id === 'chip-1y' && tier.label !== '1 AÑO') {
    console.error('chip-1y label must be exactly "1 AÑO"');
    process.exit(1);
  }
}

const ladderPath = path.join(repo, 'android/app/src/main/assets/widget-chip-ladder.json');
const ladder = JSON.parse(fs.readFileSync(ladderPath, 'utf8'));
for (const row of ladder) {
  checkString(row.id, row.label, 'widget-chip-ladder.json');
}

const scanFiles = [
  'js/share-card.js',
  'scripts/render-widget-mock.mjs',
  'android/app/src/main/java/io/github/silviodotcom/quittracker/WidgetComputer.java',
  'android/app/src/main/java/io/github/silviodotcom/quittracker/WidgetUi.java',
];

for (const rel of scanFiles) {
  const text = fs.readFileSync(path.join(repo, rel), 'utf8');
  if (/\bANO\b/.test(text) && !text.includes('//') && text.match(/"[^"]*\bANO\b[^"]*"/)) {
    const m = text.match(/"[^"]*\bANO\b[^"]*"/);
    if (m && !m[0].includes('AÑO')) {
      console.error(`${rel}: string literal with ANO: ${m[0]}`);
      process.exit(1);
    }
  }
  const literals = text.match(/"([^"\\]|\\.)*"/g) || [];
  for (const lit of literals) {
    const inner = lit.slice(1, -1);
    if (inner.includes('ANO') && !inner.includes('AÑO') && /\bANO\b/.test(inner)) {
      console.error(`${rel}: forbidden literal ${lit}`);
      process.exit(1);
    }
    if (UNACCENTED_DIAS.test(inner)) {
      console.error(`${rel}: use DÍAS in ${lit}`);
      process.exit(1);
    }
  }
}

console.log('no-ano-literal ok');
