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
  if (await page.locator('#modal-setup.open').count()) {
    await page.locator('#setup-form button[type=submit]').tap();
    await page.waitForTimeout(300);
  }

  if (await page.locator('#modal-rank-up.open').count()) {
    await page.locator('[data-close="modal-rank-up"]').tap();
    await page.waitForTimeout(200);
  }

  for (const tab of ['home', 'rank', 'badges', 'more']) {
    await page.locator(`.nav-btn[data-nav="${tab}"]`).tap();
    await page.waitForTimeout(200);
    const ok = await page.locator(`[data-view="${tab}"]:not(.hidden)`).count();
    if (!ok) throw new Error(`${name}: tab ${tab} failed`);
  }

  await page.locator('.nav-btn[data-nav="home"]').tap();
  await page.locator('#btn-health-toggle').tap();
  await page.locator('.nav-btn[data-nav="more"]').tap();
  await page.fill('#settings-cpd', '12');
  await page.locator('#settings-form button[type=submit]').tap();

  if (name === 'fresh') {
    await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/home-simplified-mobile.png', fullPage: true });
  }
  await page.screenshot({ path: `/opt/cursor/artifacts/screenshots/more-settings-mobile.png`, fullPage: true });

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
  personalBestStreak: 12,
});

await runCase('fresh', null);
await runCase('legacy', legacy);
console.log('all tests passed');
