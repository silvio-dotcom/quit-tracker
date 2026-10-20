#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const www = path.join(root, 'www');

const SKIP = new Set([
  'node_modules',
  'www',
  'android',
  '.git',
  '.github',
  'package-lock.json',
  'capacitor.js',
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (SKIP.has(name)) continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

fs.rmSync(www, { recursive: true, force: true });
copyDir(root, www);

const capBridge = path.join(root, 'node_modules/@capacitor/core/dist/capacitor.js');
if (fs.existsSync(capBridge)) {
  fs.copyFileSync(capBridge, path.join(www, 'capacitor.js'));
  console.log('copied Capacitor bridge to www/capacitor.js');
} else {
  console.warn('Capacitor bridge missing — run npm ci before cap sync');
}

console.log('synced web assets to www/');
