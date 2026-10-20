#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8767;
const serveRoot = '/tmp/qt-touch';
const appRoot = path.join(serveRoot, 'quit-tracker');
fs.rmSync(serveRoot, { recursive: true, force: true });
fs.mkdirSync(appRoot, { recursive: true });
fs.cpSync(repo, appRoot, { recursive: true, filter: (s) => !s.includes('/.git/') && !s.includes('node_modules') });
const base = `http://127.0.0.1:${port}/quit-tracker/`;

const server = spawn('node', [path.join(repo, 'scripts/gh-pages-server.mjs'), serveRoot, String(port)], {
  stdio: 'inherit',
});

await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'block',
});
const page = await context.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`);
});

const tabs = ['home', 'rank', 'health', 'badges', 'charts', 'log', 'more'];
await page.goto(base, { waitUntil: 'networkidle' });
if (await page.locator('#modal-setup.open').count()) {
  await page.locator('#setup-form button[type=submit]').tap();
  await page.waitForTimeout(300);
}

for (const tab of tabs) {
  await page.locator(`.nav-btn[data-nav="${tab}"]`).tap();
  await page.waitForTimeout(250);
  const visible = await page.locator(`[data-view=${tab}]:not(.hidden)`).count();
  if (!visible) throw new Error(`Tab ${tab} did not open`);
}

await page.locator('.nav-btn[data-nav=more]').tap();
await page.fill('#settings-cpd', '10');
await page.locator('#settings-form button[type=submit]').tap();
await page.waitForTimeout(200);

await page.fill('#goal-name', 'Test goal');
await page.fill('#goal-amount', '200');
await page.locator('#goal-form button[type=submit]').tap();
await page.waitForTimeout(200);

await page.locator('#btn-add-reason').tap();
await page.waitForTimeout(200);

await page.locator('#btn-open-setup').tap();
await page.waitForTimeout(200);
if (!(await page.locator('#modal-setup.open').count())) throw new Error('Setup wizard did not open');
await page.keyboard.press('Escape');
await page.evaluate(() => document.getElementById('modal-setup')?.classList.remove('open'));

const exportDownload = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
await page.locator('#btn-export').tap();
await exportDownload;

await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/more-settings-mobile.png', fullPage: true });

console.log('Console errors:', consoleErrors.length ? consoleErrors : '(none)');
await browser.close();
server.kill();
if (consoleErrors.length) process.exit(1);
