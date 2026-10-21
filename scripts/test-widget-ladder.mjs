#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS, MAX_CHIP_MS } from '../js/constants.js';

const assetPath = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'android/app/src/main/assets/widget-chip-ladder.json'
);

if (!fs.existsSync(assetPath)) {
  console.error('missing widget-chip-ladder.json — run scripts/export-widget-ladder.mjs');
  process.exit(1);
}

const asset = JSON.parse(fs.readFileSync(assetPath, 'utf8'));
if (asset.length !== BASE_SMOKE_FREE_CHIPS.length) {
  console.error('widget ladder length mismatch');
  process.exit(1);
}

for (let i = 0; i < asset.length; i++) {
  const a = asset[i];
  const b = BASE_SMOKE_FREE_CHIPS[i];
  if (a.id !== b.id || a.ms !== b.ms || a.label !== b.label) {
    console.error(`widget ladder drift at ${b.id}`);
    process.exit(1);
  }
}

const last = asset[asset.length - 1];
if (last.id !== 'chip-1y' || last.ms !== MAX_CHIP_MS) {
  console.error('widget ladder must end at 1y / 365d');
  process.exit(1);
}

console.log('widget ladder OK');
