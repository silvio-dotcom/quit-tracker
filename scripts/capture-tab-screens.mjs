#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8778;
const serveRoot = '/tmp/qt-capture';
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
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(base, { waitUntil: 'networkidle' });
if (await page.locator('#modal-setup.open').count()) {
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForTimeout(400);
}
if (await page.locator('#modal-rank-up.open').count()) {
  await page.locator('[data-close="modal-rank-up"]').click();
}

const tabs = [
  { nav: 'home', file: 'home-simplified-mobile.png', scroll: false },
  { nav: 'home', file: 'home-scrolled-mobile.png', scroll: true },
  { nav: 'rank', file: 'tab-rank-mobile.png', scroll: false },
  { nav: 'rank', file: 'tab-rank-scrolled-mobile.png', scroll: true },
  { nav: 'badges', file: 'tab-badges-mobile.png', scroll: false },
  { nav: 'badges', file: 'tab-badges-scrolled-mobile.png', scroll: true },
  { nav: 'more', file: 'more-settings-mobile.png', scroll: false },
  { nav: 'more', file: 'more-scrolled-mobile.png', scroll: true },
];

let failed = false;
for (const { nav, file, scroll } of tabs) {
  await page.locator(`.nav-btn[data-nav="${nav}"]`).click();
  await page.waitForTimeout(350);
  const viewVisible = await page.locator(`[data-view="${nav}"]:not(.hidden)`).count();
  if (!viewVisible) {
    console.error(`FAIL: view ${nav} not visible for ${file}`);
    failed = true;
  }
  if (nav === 'home' && !scroll) {
    const health = await page.locator('.health-home-section h2').textContent();
    if (!health?.includes('Health')) {
      console.error('FAIL: home screenshot missing health section');
      failed = true;
    }
  }
  if (nav === 'more') {
    const quitVal = await page.inputValue('#settings-quit');
    if (!quitVal) {
      console.error('FAIL: settings-quit empty');
      failed = true;
    }
  }
  const dupDays = await page.evaluate(() => /days\s+days/i.test(document.body.innerText));
  if (dupDays) {
    console.error(`FAIL: duplicated "days" on ${nav} tab`);
    failed = true;
  }
  if (scroll) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({ path: path.join(out, file), fullPage: false });
}

console.log('errors', errors.length ? errors : 'none');
if (failed) process.exit(1);
await browser.close();
srv.kill();
if (errors.length) process.exit(1);
