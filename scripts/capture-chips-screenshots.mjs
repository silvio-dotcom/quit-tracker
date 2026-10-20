#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8787;
const serveRoot = '/tmp/qt-v17-chips';
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
  viewport: { width: 412, height: 915 },
  isMobile: true,
  serviceWorkers: 'block',
})).newPage();

const MS_D = 24 * 60 * 60 * 1000;
const seed = {
  version: 5,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 30 * MS_D).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: [],
  seenRanks: [],
  achievementUnlocks: {},
  badgeMigrationV9: true,
  celebrationMigrationV14: true,
  chipCelebrationMigrationV17: true,
  seenMilestoneCelebrations: [
    'chip:chip-24h',
    'chip:chip-3d',
    'chip:chip-1w',
    'chip:chip-3w',
    'chip:chip-1mo',
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
await page.goto(base, { waitUntil: 'networkidle' });
for (let i = 0; i < 12; i++) {
  if (await page.locator('.modal.open').count()) {
    await page.locator('.modal.open [data-close]').first().click();
    await page.waitForTimeout(250);
    continue;
  }
  break;
}
await page.evaluate(() => {
  document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
  document.body.classList.remove('modal-open');
});
await page.waitForSelector('#hero-chip-mount svg');
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'hero-30day-chip.png'), fullPage: false });

await page.locator('#hero-chip-btn').click();
await page.waitForSelector('#modal-chips.open');
await page.waitForTimeout(350);
await page.screenshot({ path: path.join(out, 'my-chips-sheet.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('saved hero-30day-chip.png and my-chips-sheet.png');
