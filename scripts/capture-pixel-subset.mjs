#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8798;
const serveRoot = '/tmp/qt-pixel-subset';
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

function seed(ms) {
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
    seenRanks: ['rookie', 'fighter', 'veteran'],
    achievementUnlocks: {},
    badgeMigrationV9: true,
    celebrationMigrationV14: true,
    chipCelebrationMigrationV17: true,
    seenMilestoneCelebrations: [],
    milestoneAlertsEnabled: false,
  };
}

async function prepare(browser) {
  return browser
    .newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 3,
      isMobile: true,
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
    })
    .then((c) => c.newPage());
}

async function silenceModals(page) {
  await page.evaluate(async () => {
    const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
    const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1') || 'null');
    if (raw) {
      raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
      localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
    }
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
}

async function load(page, smokeMs) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([key, d]) => localStorage.setItem(key, JSON.stringify(d)), [STORAGE_KEY, seed(smokeMs)]);
  await silenceModals(page);
}

const browser = await chromium.launch();

const home30 = await prepare(browser);
await load(home30, 30 * MS_D);
await home30.waitForTimeout(350);
await home30.screenshot({ path: path.join(out, 'pixel-home-30d.png'), fullPage: false });

const badges1 = await prepare(browser);
await load(badges1, 26 * MS_H);
await badges1.locator('[data-nav="badges"]').click();
await badges1.waitForSelector('[data-view="badges"]:not(.hidden)');
await badges1.waitForTimeout(400);
await badges1.screenshot({ path: path.join(out, 'pixel-badges-1d.png'), fullPage: false });

const badges300 = await prepare(browser);
await load(badges300, 300 * MS_D);
await badges300.locator('[data-nav="badges"]').click();
await badges300.waitForSelector('[data-view="badges"]:not(.hidden)');
await badges300.waitForTimeout(400);
await badges300.screenshot({ path: path.join(out, 'pixel-badges-300d.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('saved pixel-home-30d.png, pixel-badges-1d.png, pixel-badges-300d.png');
