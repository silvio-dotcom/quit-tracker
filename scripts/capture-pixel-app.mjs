#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8797;
const serveRoot = '/tmp/qt-pixel-capture';
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
    milestoneAlertsEnabled: true,
  };
}

async function newPage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  return ctx.newPage();
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

async function loadWithSmokeMs(page, smokeMs) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([key, d]) => localStorage.setItem(key, JSON.stringify(d)),
    [STORAGE_KEY, seed(smokeMs)]
  );
  await silenceModals(page);
}

const browser = await chromium.launch();

const home1 = await newPage(browser);
await loadWithSmokeMs(home1, 26 * MS_H);
await home1.evaluate(() => window.scrollTo(0, 0));
await home1.waitForTimeout(350);
await home1.screenshot({ path: path.join(out, 'pixel-home-1d.png'), fullPage: false });

const home30 = await newPage(browser);
await loadWithSmokeMs(home30, 30 * MS_D);
await home30.evaluate(() => window.scrollTo(0, 0));
await home30.waitForTimeout(350);
await home30.screenshot({ path: path.join(out, 'pixel-home-30d.png'), fullPage: false });

const rankP = await newPage(browser);
await loadWithSmokeMs(rankP, 45 * MS_D);
await rankP.locator('[data-nav="rank"]').click();
await rankP.waitForSelector('[data-view="rank"]:not(.hidden)');
await rankP.waitForTimeout(400);
await rankP.screenshot({ path: path.join(out, 'pixel-rank.png'), fullPage: false });

const badges1 = await newPage(browser);
await loadWithSmokeMs(badges1, 26 * MS_H);
await badges1.locator('[data-nav="badges"]').click();
await badges1.waitForSelector('[data-view="badges"]:not(.hidden)');
await badges1.waitForTimeout(400);
await badges1.screenshot({ path: path.join(out, 'pixel-badges-1d.png'), fullPage: false });

const badges300 = await newPage(browser);
await loadWithSmokeMs(badges300, 300 * MS_D);
await badges300.locator('[data-nav="badges"]').click();
await badges300.waitForSelector('[data-view="badges"]:not(.hidden)');
await badges300.waitForTimeout(400);
await badges300.screenshot({ path: path.join(out, 'pixel-badges-300d.png'), fullPage: false });

const healthP = await newPage(browser);
await loadWithSmokeMs(healthP, 14 * MS_D);
await healthP.locator('#btn-health-toggle').click();
await healthP.waitForTimeout(400);
await healthP.evaluate(() => {
  const el = document.querySelector('.health-home-section');
  if (el) el.scrollIntoView({ block: 'start' });
});
await healthP.waitForTimeout(200);
await healthP.screenshot({ path: path.join(out, 'pixel-health.png'), fullPage: false });

const moreP = await newPage(browser);
await loadWithSmokeMs(moreP, 10 * MS_D);
await moreP.locator('[data-nav="more"]').click();
await moreP.waitForSelector('[data-view="more"]:not(.hidden)');
await moreP.waitForTimeout(400);
await moreP.screenshot({ path: path.join(out, 'pixel-more.png'), fullPage: false });

const shareP = await newPage(browser);
await loadWithSmokeMs(shareP, 60 * MS_D);
await shareP.locator('#btn-share-progress').click();
await shareP.waitForSelector('#modal-share-preview.open');
await shareP.waitForFunction(() => {
  const img = document.getElementById('share-preview-image');
  return img && img.src && (img.src.startsWith('blob:') || img.src.startsWith('data:'));
});
await shareP.waitForTimeout(500);
await shareP.screenshot({ path: path.join(out, 'pixel-share.png'), fullPage: false });

const setupCtx = await browser.newContext({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 3,
  isMobile: true,
  serviceWorkers: 'block',
  reducedMotion: 'reduce',
});
const setupP = await setupCtx.newPage();
await setupP.goto(base, { waitUntil: 'networkidle' });
await setupP.waitForSelector('#modal-setup.open', { timeout: 8000 });
await setupP.waitForTimeout(300);
await setupP.screenshot({ path: path.join(out, 'pixel-setup.png'), fullPage: false });

await browser.close();
srv.kill();
console.log(
  'saved pixel-home-1d.png, pixel-home-30d.png, pixel-rank.png, pixel-badges-1d.png, pixel-badges-300d.png, pixel-health.png, pixel-more.png, pixel-share.png, pixel-setup.png'
);
