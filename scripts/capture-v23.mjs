#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8801;
const serveRoot = '/tmp/qt-v23-capture';
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
const CHIP_COUNT = BASE_SMOKE_FREE_CHIPS.length;

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
    seenRanks: [],
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

const home30h = await ctxPage(browser);
await load(home30h, 30 * MS_H);
await home30h.waitForSelector('#hero-chip-mount .pixel-coin-svg');
await home30h.waitForTimeout(350);
await home30h.screenshot({ path: path.join(out, 'v23-home-30h.png'), fullPage: false });

const home45d = await ctxPage(browser);
await load(home45d, 4.5 * MS_D);
await home45d.waitForSelector('#hero-chip-mount .pixel-coin-svg');
await home45d.waitForTimeout(350);
await home45d.screenshot({ path: path.join(out, 'v23-home-4d5.png'), fullPage: false });

const sheetP = await ctxPage(browser);
await load(sheetP, 45 * MS_D);
await sheetP.locator('#hero-chip-btn').click();
await sheetP.waitForSelector('#modal-chips.open');
await sheetP.waitForSelector('#chips-grid .chips-grid-item');
const gridCount = await sheetP.locator('#chips-grid .chips-grid-item').count();
if (gridCount !== CHIP_COUNT) {
  console.error(`expected ${CHIP_COUNT} chips in sheet, got ${gridCount}`);
  process.exit(1);
}
await sheetP.evaluate(() => {
  const panel = document.querySelector('.chips-sheet-panel');
  if (panel) panel.scrollTop = 0;
});
await sheetP.waitForTimeout(200);
await sheetP.screenshot({ path: path.join(out, 'v23-chips-ladder.png'), fullPage: true });

await browser.close();
srv.kill();
console.log('saved v23-home-30h.png, v23-home-4d5.png, v23-chips-ladder.png');
