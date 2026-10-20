#!/usr/bin/env node
/**
 * Simulates: install PR#1 broken app + v1 SW, then deploy v3 and reload like a user.
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, '..');
const tmp = '/tmp/qt-sim';
const v1Dir = path.join(tmp, 'v1');
const v3Dir = path.join(tmp, 'v3');
const port = 8766;

function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, filter: (s) => !s.includes('/.git/') });
}

function startServer(root) {
  const proc = spawn('node', [path.join(repo, 'scripts/gh-pages-server.mjs'), root, String(port)], {
    stdio: 'inherit',
  });
  return proc;
}

async function waitReady() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/quit-tracker/`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server not ready');
}

// v1 = broken PR#1 at 7c347ec layout under quit-tracker/
fs.mkdirSync(tmp, { recursive: true });
const v1Root = path.join(v1Dir, 'quit-tracker');
fs.rmSync(v1Root, { recursive: true, force: true });
fs.mkdirSync(v1Root, { recursive: true });
const { execSync } = await import('child_process');
execSync(`git archive 7c347ec | tar -x -C "${v1Root}"`, { cwd: repo });

const v3Root = path.join(v3Dir, 'quit-tracker');
copyDir(repo, v3Root);

let server = startServer(v1Dir);
await waitReady();

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  serviceWorkers: 'allow',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const base = `http://127.0.0.1:${port}/quit-tracker/`;
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);

// Manually install v1 SW as the broken app would have if it parsed (simulate cached broken era)
await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
  } catch (e) {
    console.log('v1 sw reg', e);
  }
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);

// Switch deployment to v3 (same URL)
server.kill();
server = startServer(v3Dir);
await waitReady();

let moreWorks = false;
for (let i = 0; i < 8; i++) {
  errors.length = 0;
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) await reg.update();
  });
  await page.waitForTimeout(2000);
  const setup = page.locator('#modal-setup.open');
  if (await setup.count()) {
    await page.locator('#setup-form button[type=submit]').click();
    await page.waitForTimeout(400);
  }
  if (await page.locator('#modal-setup.open').count()) {
    await page.locator('#setup-form button[type=submit]').click();
    await page.waitForTimeout(400);
  }
  await page.locator('.nav-btn[data-nav=more]').click({ force: true });
  await page.waitForTimeout(500);
  moreWorks = await page.locator('#settings-form').isVisible();
  console.log(`reload ${i + 1}: more=${moreWorks} errors=${errors.join('; ')}`);
  if (moreWorks && !errors.some((e) => e.includes('Invalid left-hand side'))) break;
}
if (!moreWorks) {
  const st = await page.evaluate(() => ({
    ready: window.__QT_APP_READY__,
    build: window.__QT_BUILD__,
    sw: navigator.serviceWorker.controller?.scriptURL,
  }));
  console.error('final state', st);
}

await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/more-settings-mobile.png', fullPage: true });
await browser.close();
server.kill();

if (!moreWorks) {
  console.error('RECOVERY FAILED');
  process.exit(1);
}
console.log('RECOVERY OK');
