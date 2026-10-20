#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8783;
const serveRoot = '/tmp/qt-v14';
const appRoot = path.join(serveRoot, 'quit-tracker');
const out = '/opt/cursor/artifacts/screenshots';

fs.rmSync(serveRoot, { recursive: true, force: true });
fs.mkdirSync(appRoot, { recursive: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(repo, appRoot, {
  recursive: true,
  filter: (s) => !s.includes('/.git/') && !s.includes('node_modules'),
});

const srv = spawn('node', [path.join(repo, 'scripts/gh-pages-server.mjs'), serveRoot, String(port)], {
  stdio: 'pipe',
});
await new Promise((r) => setTimeout(r, 450));

const base = `http://127.0.0.1:${port}/quit-tracker/`;
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  serviceWorkers: 'block',
})).newPage();

const seed = {
  version: 4,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: ['time-20m', 'time-1h'],
  seenRanks: ['rookie', 'fighter'],
  achievementUnlocks: {},
  badgeMigrationV9: true,
  celebrationMigrationV14: true,
  seenMilestoneCelebrations: ['health:who-20m', 'badge:time-20m', 'badge:time-1h'],
  milestoneAlertsEnabled: false,
};

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate((d) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(d)), seed);
await page.goto(base, { waitUntil: 'networkidle' });
if (await page.locator('#modal-setup.open').count()) {
  await page.locator('#setup-form button[type=submit]').click();
}
if (await page.locator('#modal-rank-up.open').count()) {
  await page.locator('[data-close="modal-rank-up"]').click();
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'home-v14-next-up-mobile.png'), fullPage: false });

const b64 = await page.evaluate(async () => {
  const mod = await import(new URL('js/share-card.js', window.location.href).href);
  const raw = localStorage.getItem('quit-tracker-data-v1');
  const state = JSON.parse(raw);
  const blob = await mod.renderSharePng(state);
  const buf = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
});
fs.writeFileSync(path.join(out, 'share-card-v14.png'), Buffer.from(b64, 'base64'));

await browser.close();
srv.kill();
console.log('captures done');
