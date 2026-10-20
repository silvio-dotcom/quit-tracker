#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8782;
const serveRoot = '/tmp/qt-pr9';
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
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'block',
});
const page = await ctx.newPage();

const seed = {
  version: 3,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: [],
  seenRanks: ['rookie', 'fighter'],
  achievementUnlocks: {},
  badgeMigrationV9: true,
};

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate((data) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(data)), seed);
await page.goto(base, { waitUntil: 'networkidle' });
if (await page.locator('#modal-rank-up.open').count()) {
  await page.locator('[data-close="modal-rank-up"]').click();
}

await page.evaluate(() => {
  document.querySelector('#install-home-banner')?.classList.remove('hidden');
  document.querySelector('#btn-install-header')?.classList.remove('hidden');
});
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'home-rank-install-mobile.png'), fullPage: false });

await page.locator('#btn-install-home').click();
await page.waitForTimeout(200);
const iosOpen = await page.locator('#modal-ios-install.open').count();
if (!iosOpen) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('qt-force-ios-install'));
  });
}
await page.evaluate(() => {
  const modal = document.querySelector('#modal-ios-install');
  if (modal) modal.classList.add('open');
});
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(out, 'ios-install-sheet-mobile.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('screenshots saved');
