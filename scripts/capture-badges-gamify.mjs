#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8795;
const serveRoot = '/tmp/qt-badges-v19';
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

async function pageReady(page, smokeMs) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate((d) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(d)), seed(smokeMs));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
    const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1'));
    raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
    localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i++) {
    if (await page.locator('.modal.open').count()) {
      await page.locator('.modal.open [data-close]').first().click();
      await page.waitForTimeout(200);
      continue;
    }
    break;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
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

const browser = await chromium.launch();

const p1 = await prepare(browser);
await pageReady(p1, 26 * MS_H);
await p1.evaluate(() => {
  document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
  document.body.classList.remove('modal-open');
});
await p1.locator('[data-nav="badges"]').click();
await p1.waitForSelector('[data-view="badges"]:not(.hidden)');
await p1.waitForTimeout(400);
await p1.screenshot({ path: path.join(out, 'badges-gamify-1d.png'), fullPage: false });

const p30 = await prepare(browser);
await pageReady(p30, 30 * MS_D);
await p30.evaluate(() => {
  document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
  document.body.classList.remove('modal-open');
});
await p30.locator('[data-nav="badges"]').click();
await p30.waitForSelector('[data-view="badges"]:not(.hidden)');
await p30.waitForTimeout(400);
await p30.screenshot({ path: path.join(out, 'badges-gamify-30d.png'), fullPage: false });

const ph = await prepare(browser);
await pageReady(ph, 26 * MS_H);
await ph.evaluate(() => {
  document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
  document.body.classList.remove('modal-open');
});
await ph.locator('[data-nav="home"]').click();
await ph.waitForTimeout(350);
await ph.screenshot({ path: path.join(out, 'badges-gamify-home.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('saved badges-gamify-1d.png, badges-gamify-30d.png, badges-gamify-home.png');
