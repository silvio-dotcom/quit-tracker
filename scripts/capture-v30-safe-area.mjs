#!/usr/bin/env node
/**
 * Pixel 9 Pro XL safe-area check: 412×915 viewport, 52px top (status + cutout), 24px bottom (gesture).
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8794;
const serveRoot = '/tmp/qt-v30-safe-area';
const appRoot = path.join(serveRoot, 'quit-tracker');
const out = path.join(repo, 'artifacts');
const VP = { width: 412, height: 915 };
const INSET_TOP = 52;
const INSET_BOTTOM = 24;

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
const MS_D = 24 * 60 * 60 * 1000;
const seed = {
  version: 5,
  profile: {
    displayName: 'Silvio',
    quitDate: new Date(Date.now() - 10 * MS_D).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
  seenAchievements: [],
  milestoneAlertsEnabled: false,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VP,
  isMobile: true,
  locale: 'es-419',
  serviceWorkers: 'block',
});
await ctx.addInitScript(({ top, bottom }) => {
  const root = document.documentElement;
  root.style.setProperty('--sat', `${top}px`);
  root.style.setProperty('--sab', `${bottom}px`);
  root.style.setProperty('--safe-top', `${top}px`);
  root.style.setProperty('--safe-bottom', `${bottom}px`);
  root.style.setProperty('--safe-area-inset-top', `${top}px`);
  root.style.setProperty('--safe-area-inset-bottom', `${bottom}px`);
}, { top: INSET_TOP, bottom: INSET_BOTTOM });

const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate((d) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(d)), seed);
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(
  ({ top, bottom }) => {
    const root = document.documentElement;
    root.style.setProperty('--sat', `${top}px`);
    root.style.setProperty('--sab', `${bottom}px`);
    root.style.setProperty('--safe-top', `${top}px`);
    root.style.setProperty('--safe-bottom', `${bottom}px`);
    root.style.setProperty('--safe-area-inset-top', `${top}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${bottom}px`);
  },
  { top: INSET_TOP, bottom: INSET_BOTTOM }
);
await page.waitForSelector('.plat-hud');
await page.waitForTimeout(400);

const hudPadTop = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.plat-hud')).paddingTop));
if (hudPadTop < INSET_TOP) {
  console.error(`HUD padding-top ${hudPadTop}px < inset ${INSET_TOP}px`);
  process.exit(1);
}

const labelBox = await page.locator('#plat-hud-dias-label').boundingBox();
if (!labelBox || labelBox.y < INSET_TOP - 1) {
  console.error(`HUD label top ${labelBox?.y} is under safe inset ${INSET_TOP}px`);
  process.exit(1);
}

const navBox = await page.locator('.bottom-nav').boundingBox();
if (!navBox || navBox.y + navBox.height > VP.height - INSET_BOTTOM + 2) {
  console.error('Bottom nav overlaps gesture safe area');
  process.exit(1);
}

await page.screenshot({ path: path.join(out, 'v30-safe-area-inicio.png'), fullPage: false });

await page.locator('[data-nav="rank"]').click();
await page.waitForSelector('#rank-ladder .rank-row');
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: path.join(out, 'v30-safe-area-rango.png'), fullPage: false });

await page.locator('[data-nav="badges"]').click();
await page.waitForSelector('#medallas-ladder .chips-grid-item');
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: path.join(out, 'v30-safe-area-medallas.png'), fullPage: false });

const browserPlain = await chromium.launch();
const ctxPlain = await browserPlain.newContext({ viewport: VP, isMobile: true, locale: 'es-419' });
const plain = await ctxPlain.newPage();
await plain.goto(base, { waitUntil: 'domcontentloaded' });
await plain.evaluate((d) => localStorage.setItem('quit-tracker-data-v1', JSON.stringify(d)), seed);
await plain.reload({ waitUntil: 'networkidle' });
await plain.waitForSelector('.plat-hud');
await plain.screenshot({ path: path.join(out, 'v30-safe-area-inicio-browser.png'), fullPage: false });
await browserPlain.close();

await browser.close();
srv.kill();

console.log('safe-area OK; saved v30-safe-area-*.png at 412×915 (52/24 insets on native mock)');
