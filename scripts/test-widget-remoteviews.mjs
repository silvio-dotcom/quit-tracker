#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const layoutDir = path.join(repo, 'android/app/src/main/res/layout');

const ALLOWED = new Set([
  'FrameLayout',
  'LinearLayout',
  'RelativeLayout',
  'GridLayout',
  'AnalogClock',
  'Button',
  'Chronometer',
  'ImageButton',
  'ImageView',
  'ProgressBar',
  'TextView',
  'ViewFlipper',
  'ListView',
  'GridView',
  'StackView',
  'AdapterViewFlipper',
  'TextClock',
  'CheckBox',
  'Switch',
  'RadioButton',
  'RadioGroup',
]);

const widgetLayouts = fs
  .readdirSync(layoutDir)
  .filter((f) => f.startsWith('widget_') && f.endsWith('.xml'));

let failed = false;

for (const file of widgetLayouts) {
  const xml = fs.readFileSync(path.join(layoutDir, file), 'utf8');
  if (/android:fontFamily\s*=\s*"@font\//.test(xml)) {
    console.error(`${file}: uses @font in RemoteViews layout`);
    failed = true;
  }
  const tags = xml.match(/<([A-Za-z0-9_.]+)\b/g) || [];
  for (const raw of tags) {
    const tag = raw.slice(1);
    if (tag.startsWith('?')) continue;
    const simple = tag.includes('.') ? tag.split('.').pop() : tag;
    if (!ALLOWED.has(simple)) {
      console.error(`${file}: disallowed tag <${simple}> for AppWidget RemoteViews`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`widget RemoteViews layouts OK (${widgetLayouts.length} files)`);
