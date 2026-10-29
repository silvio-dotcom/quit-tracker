#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8792;
const serveRoot = '/tmp/qt-v28-es-screens';
const appRoot = path.join(serveRoot, 'quit-tracker');
const out = path.join(repo, 'artifacts');

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
const page = await (
  await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    locale: 'es-419',
    serviceWorkers: 'block',
  })
).newPage();

const MS_D = 24 * 60 * 60 * 1000;
const seed = {
  version: 5,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 8 * MS_D).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: [],
  seenRanks: ['rookie', 'fighter', 'survivor', 'warrior', 'guardian', 'champion', 'veteran'],
  achievementUnlocks: {},
  badgeMigrationV9: true,
  celebrationMigrationV14: true,
  chipCelebrationMigrationV17: true,
  seenMilestoneCelebrations: [
    'chip:chip-24h',
    'chip:chip-2d',
    'chip:chip-3d',
    'chip:chip-4d',
    'chip:chip-5d',
    'chip:chip-6d',
    'chip:chip-1w',
  ],
  milestoneAlertsEnabled: false,
};

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate((d) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(d)), seed);
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
  const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1'));
  raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
  raw.chipCelebrationMigrationV17 = true;
  localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
  document.body.classList.remove('modal-open');
});
await page.waitForSelector('#live-counter .counter-val');
await page.screenshot({ path: path.join(out, 'home-es-419.png'), fullPage: false });

await page.evaluate(async () => {
  const { BASE_SMOKE_FREE_CHIPS } = await import(new URL('js/constants.js', window.location.href).href);
  const { showChipHealthUnlockModal } = await import(
    new URL('js/chip-health-unlock-ui.js', window.location.href).href
  );
  const tier = BASE_SMOKE_FREE_CHIPS.find((t) => t.id === 'chip-1w');
  showChipHealthUnlockModal(tier, () => {});
});
await page.waitForSelector('#modal-chip-health.open');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'health-card-es-419-1w.png'), fullPage: false });

await browser.close();
srv.kill();

console.log('saved artifacts/home-es-419.png and health-card-es-419-1w.png');
