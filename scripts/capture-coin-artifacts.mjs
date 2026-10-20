#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8789;
const serveRoot = '/tmp/qt-coin-artifacts';
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

function seedForSmokeFreeMs(ms) {
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

async function preparePage(browser) {
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

async function freezeCoinsFaceOn(page) {
  await page.addStyleTag({
    content: `.pixel-coin-spin {
      animation: none !important;
      transform: scaleX(1) !important;
    }`,
  });
  await page.evaluate(() => {
    document.querySelectorAll('.pixel-coin-spin').forEach((el) => {
      el.style.animation = 'none';
      el.style.transform = 'scaleX(1)';
    });
  });
  await page.waitForTimeout(120);
}

async function loadApp(page, seed) {
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
      await page.waitForTimeout(200);
      continue;
    }
    break;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
  await page.waitForSelector('#hero-chip-mount .pixel-coin-svg');
  await page.evaluate(() => window.scrollTo(0, 0));
  await freezeCoinsFaceOn(page);
}

const browser = await chromium.launch();

const page1 = await preparePage(browser);
await loadApp(page1, seedForSmokeFreeMs(26 * MS_H));
await freezeCoinsFaceOn(page1);
await page1.screenshot({ path: path.join(out, 'chips-coin-hero-1d.png'), fullPage: false });

const page30 = await preparePage(browser);
await loadApp(page30, seedForSmokeFreeMs(30 * MS_D));
await freezeCoinsFaceOn(page30);
await page30.screenshot({ path: path.join(out, 'chips-coin-hero-30d.png'), fullPage: false });

const pageSheet = await preparePage(browser);
await loadApp(pageSheet, seedForSmokeFreeMs(26 * MS_H));
await pageSheet.locator('#hero-chip-btn').click();
await pageSheet.waitForSelector('#modal-chips.open');
await pageSheet.waitForTimeout(350);
await freezeCoinsFaceOn(pageSheet);
await pageSheet.screenshot({ path: path.join(out, 'chips-coin-sheet.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('saved chips-coin-hero-1d.png, chips-coin-hero-30d.png, chips-coin-sheet.png');
