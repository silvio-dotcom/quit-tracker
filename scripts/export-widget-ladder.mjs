#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out =
  process.argv[2] ||
  path.join(repo, 'android/app/src/main/assets/widget-chip-ladder.json');

const ladder = BASE_SMOKE_FREE_CHIPS.map((t) => ({
  id: t.id,
  label: t.label,
  shortLabel: t.shortLabel,
  ms: t.ms,
  kind: t.kind,
  rim: t.palette.rim,
}));

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(ladder, null, 2)}\n`);
console.log(`wrote ${out} (${ladder.length} chips)`);
