#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8800;
const serveRoot = '/tmp/qt-v22-capture';
const appRoot = path.join(serveRoot, 'quit-tracker');
const out = '/opt/cursor/artifacts';

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
const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;
const STORAGE_KEY = 'quit-tracker-data-v1';

function seed(ms, extra = {}) {
  return {
    version: 5,
    profile: {
      displayName: 'Silvio',
      quitDate: new Date(Date.now() - ms).toISOString(),
      cigsPerDay: 15,
      cigsPerPack: 20,
      packPrice: 12,
      currency: 'USD',
    },
    seenAchievements: [],
    seenRanks: ['rookie', 'fighter', 'veteran', 'legend'],
    achievementUnlocks: {},
    badgeMigrationV9: true,
    celebrationMigrationV14: true,
    chipCelebrationMigrationV17: true,
    seenMilestoneCelebrations: [],
    milestoneAlertsEnabled: false,
    ...extra,
  };
}

async function ctxPage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3,
    isMobile: true,
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  return ctx.newPage();
}

async function load(page, ms, extra) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [STORAGE_KEY, seed(ms, extra)]);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
    const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1'));
    raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
    localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
}

const browser = await chromium.launch();

const sheetP = await ctxPage(browser);
await load(sheetP, 45 * MS_D);
await sheetP.locator('#hero-chip-btn').click();
await sheetP.waitForSelector('#modal-chips.open');
await sheetP.waitForSelector('#chips-grid .chips-grid-item');
await sheetP.waitForTimeout(350);
const gridCount = await sheetP.locator('#chips-grid .chips-grid-item').count();
if (gridCount !== 12) {
  console.error(`expected 12 chips in sheet, got ${gridCount}`);
  process.exit(1);
}
await sheetP.screenshot({ path: path.join(out, 'v22-chips-sheet-45d.png'), fullPage: false });

const home14 = await ctxPage(browser);
await load(home14, 14 * MS_D);
await home14.waitForSelector('#hero-chip-mount .pixel-coin-svg');
await home14.waitForTimeout(350);
await home14.screenshot({ path: path.join(out, 'v22-home-14d.png'), fullPage: false });

const home400 = await ctxPage(browser);
await load(home400, 400 * MS_D);
await home400.waitForSelector('.hero-chip-max');
await home400.waitForTimeout(350);
await home400.screenshot({ path: path.join(out, 'v22-home-400d.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('saved v22-chips-sheet-45d.png, v22-home-14d.png, v22-home-400d.png');
