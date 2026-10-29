#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8777;
const serveRoot = '/tmp/qt-sim5';
const appRoot = path.join(serveRoot, 'quit-tracker');

function deploy() {
  fs.rmSync(serveRoot, { recursive: true, force: true });
  fs.mkdirSync(appRoot, { recursive: true });
  fs.cpSync(repo, appRoot, {
    recursive: true,
    filter: (s) => !s.includes('/.git/') && !s.includes('node_modules'),
  });
}

async function runCase(name, seedLocalStorage) {
  deploy();
  const srv = spawn('node', [path.join(repo, 'scripts/gh-pages-server.mjs'), serveRoot, String(port)], {
    stdio: 'pipe',
  });
  await new Promise((r) => setTimeout(r, 400));
  const base = `http://127.0.0.1:${port}/quit-tracker/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  if (seedLocalStorage) {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate((data) => localStorage.setItem('quit-tracker-data-v1', data), seedLocalStorage);
  }

  await page.goto(base, { waitUntil: 'networkidle' });
  if (seedLocalStorage) {
    await page.evaluate(async () => {
      const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
      const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1'));
      if (!raw) return;
      raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
      raw.chipCelebrationMigrationV17 = true;
      localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
    });
    await page.reload({ waitUntil: 'networkidle' });
  }
  if (await page.locator('#modal-setup.open').count()) {
    await page.locator('#setup-form button[type=submit]').tap();
    await page.waitForTimeout(300);
  }

  for (let i = 0; i < 24; i++) {
    if (await page.locator('#modal-chip-health.open').count()) {
      await page.locator('[data-close="modal-chip-health"]').tap();
      await page.waitForTimeout(350);
      continue;
    }
    if (await page.locator('#modal-milestone.open').count()) {
      await page.locator('[data-close="modal-milestone"]').tap();
      await page.waitForTimeout(350);
      continue;
    }
    if (await page.locator('#modal-rank-up.open').count()) {
      await page.locator('[data-close="modal-rank-up"]').tap();
      await page.waitForTimeout(200);
      continue;
    }
    break;
  }

  for (const tab of ['home', 'rank', 'badges', 'more']) {
    await page.locator(`.nav-btn[data-nav="${tab}"]`).tap();
    await page.waitForTimeout(200);
    const ok = await page.locator(`[data-view="${tab}"]:not(.hidden)`).count();
    if (!ok) throw new Error(`${name}: tab ${tab} failed`);
  }

  const hasBestWord = await page.evaluate(() => /\bbest\b/i.test(document.body.innerText));
  if (hasBestWord) throw new Error(`${name}: UI should not contain the word "best"`);

  if (name === 'legacy') {
    const stored = await page.evaluate(() => localStorage.getItem('quit-tracker-data-v1'));
    if (stored && stored.includes('personalBestStreak')) {
      throw new Error('legacy: personalBestStreak should be stripped from localStorage');
    }
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('5000')) throw new Error('legacy: bogus 5000-day value visible in UI');
  }

  await page.locator('.nav-btn[data-nav="home"]').tap();
  const healthToggle = page.locator('#btn-health-toggle');
  if (await healthToggle.isVisible()) {
    await healthToggle.tap();
  } else {
    const platHealth = await page.locator('#plat-health-body').textContent();
    if (!platHealth || !platHealth.trim()) throw new Error(`${name}: missing plataformas health sign`);
  }
  if (name === 'fresh') {
    await page.waitForTimeout(200);
    const platHero = await page.locator('#plat-hero-days').count();
    if (!platHero) throw new Error('fresh: missing plataformas hero');
    const platPath = await page.locator('#plat-chip-path-blocks i').count();
    if (platPath !== 14) throw new Error(`fresh: expected 14 path blocks, got ${platPath}`);
    await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/home-simplified-mobile.png', fullPage: false });
    await page.locator('.nav-btn[data-nav="badges"]').tap();
    await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/tab-badges-mobile.png', fullPage: false });
    const filters = await page.locator('.badge-filter-chip').count();
    if (filters < 4) throw new Error('fresh: expected badge filter chips');
    const ladder = await page.locator('#medallas-ladder .chips-grid-item').count();
    if (ladder < 16) throw new Error('fresh: expected medallas ladder chips');
  }

  if (name === 'ten-days') {
    await page.locator('.nav-btn[data-nav="badges"]').tap();
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/tab-badges-10d-mobile.png', fullPage: false });
    const summary = await page.locator('#badge-summary').textContent();
    if (!summary || !summary.includes('/')) throw new Error('ten-days: missing badge summary');
    const unlocked = await page.locator('.badge-earned').count();
    if (unlocked < 5) throw new Error(`ten-days: expected several unlocked badges, got ${unlocked}`);
  }

  await page.locator('.nav-btn[data-nav="more"]').tap();
  await page.fill('#settings-cpd', '12');
  await page.locator('#settings-form button[type=submit]').tap();
  await page.waitForTimeout(200);
  if (name === 'fresh') {
    await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/more-settings-mobile.png', fullPage: false });
  }

  await browser.close();
  srv.kill();
  console.log(name, errors.length ? `ERRORS: ${errors.join('; ')}` : 'OK');
  if (errors.length) process.exit(1);
}

const legacy = JSON.stringify({
  version: 1,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    cigsPerDay: 20,
    cigsPerPack: 20,
    packPrice: 10,
    currency: 'USD',
  },
  reasons: [{ id: '1', text: 'Health' }],
  savingsGoal: { name: 'Bike', targetAmount: 500 },
  cravings: [{ id: 'c1', at: Date.now(), intensity: 4, trigger: 'Stress', resisted: true }],
  slips: [{ id: 's1', at: Date.now(), count: 2 }],
  seenAchievements: ['first-day'],
  seenRanks: ['rookie', 'fighter'],
  personalBestStreak: 5000,
  celebrationMigrationV14: true,
  seenMilestoneCelebrations: ['health:who-20m'],
});

const tenDays = JSON.stringify({
  version: 2,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    cigsPerDay: 20,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: ['first-day'],
  seenRanks: ['rookie', 'fighter', 'survivor', 'warrior', 'champion'],
});

await runCase('fresh', null);
await runCase('legacy', legacy);
await runCase('ten-days', tenDays);
console.log('all tests passed');
