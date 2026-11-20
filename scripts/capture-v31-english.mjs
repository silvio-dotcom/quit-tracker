#!/usr/bin/env node
/**
 * v31 US English Plataformas screenshots — 412×915 viewport.
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8795;
const serveRoot = '/tmp/qt-v31-screens';
const appRoot = path.join(serveRoot, 'quit-tracker');
const out = process.env.QT_ARTIFACTS_DIR || '/opt/cursor/artifacts';
const VP = { width: 412, height: 915 };

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
const MS_D = 24 * 60 * 60 * 1000;
const seed = {
  version: 5,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 10 * MS_D - 18 * 60 * 60 * 1000).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: ['first-day', 'three-days', 'one-week'],
  seenRanks: ['rookie', 'fighter', 'survivor', 'warrior', 'guardian'],
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

async function load(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate((d) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(d)), seed);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
    const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1'));
    raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
    localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VP,
  isMobile: true,
  locale: 'en-US',
  serviceWorkers: 'block',
});

const home = await ctx.newPage();
await load(home);
await home.waitForSelector('#plat-hero-sub');
await home.waitForSelector('#plat-stage .plat-stage-coin svg');
const diasHud = (await home.locator('#plat-hud-dias-label').innerText()).trim();
if (diasHud !== 'DAYS') {
  console.error(`HUD days label expected DAYS, got "${diasHud}"`);
  process.exit(1);
}
await home.screenshot({ path: path.join(out, 'v31-home.png'), fullPage: false });

const rank = await ctx.newPage();
await load(rank);
await rank.locator('[data-nav="rank"]').click();
await rank.waitForSelector('#rank-ladder .rank-row');
await rank.evaluate(() => window.scrollTo(0, 0));
await rank.screenshot({ path: path.join(out, 'v31-rank.png'), fullPage: false });

const med = await ctx.newPage();
await load(med);
await med.locator('[data-nav="badges"]').click();
await med.waitForSelector('#medallas-ladder .chips-grid-item');
await med.evaluate(() => window.scrollTo(0, 0));
await med.screenshot({ path: path.join(out, 'v31-medals.png'), fullPage: false });

await browser.close();
srv.kill();

console.log('saved v31-home.png, v31-rank.png, v31-medals.png at 412×915 →', out);