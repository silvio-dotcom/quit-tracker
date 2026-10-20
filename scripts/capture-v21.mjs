#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8799;
const serveRoot = '/tmp/qt-v21-capture';
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
const MS_D = 24 * 60 * 60 * 1000;
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
    seenRanks: ['rookie', 'fighter', 'veteran', 'legend'],
    achievementUnlocks: {},
    badgeMigrationV9: true,
    celebrationMigrationV14: true,
    chipCelebrationMigrationV17: true,
    seenMilestoneCelebrations: [],
    milestoneAlertsEnabled: false,
  };
}

async function ctxPage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3,
    isMobile: true,
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  return ctx.newPage();
}

async function load(page, ms) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [STORAGE_KEY, seed(ms)]);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const mod = await import(new URL('js/milestone-alerts.js', window.location.href).href);
    const raw = JSON.parse(localStorage.getItem('quit-tracker-data-v1'));
    raw.seenMilestoneCelebrations = mod.allUnlockedCelebrationKeys(raw, Date.now());
    localStorage.setItem('quit-tracker-data-v1', JSON.stringify(raw));
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
}

const browser = await chromium.launch();

const rankP = await ctxPage(browser);
await load(rankP, 200 * MS_D);
await rankP.locator('[data-nav="rank"]').click();
await rankP.waitForSelector('[data-view="rank"]:not(.hidden)');
await rankP.evaluate(() => {
  const ladder = document.getElementById('rank-ladder');
  if (ladder) ladder.scrollIntoView({ block: 'end' });
  window.scrollTo(0, document.body.scrollHeight);
});
await rankP.waitForTimeout(400);
await rankP.screenshot({ path: path.join(out, 'v21-rank-ladder.png'), fullPage: false });

const badgesP = await ctxPage(browser);
await load(badgesP, 300 * MS_D);
await badgesP.locator('[data-nav="badges"]').click();
await badgesP.waitForSelector('[data-view="badges"]:not(.hidden)');
await badgesP.locator('[data-badge-filter="timeback"]').click();
await badgesP.waitForTimeout(400);
await badgesP.screenshot({ path: path.join(out, 'v21-badges-timeback-300d.png'), fullPage: false });

const homeP = await ctxPage(browser);
await load(homeP, 30 * MS_D);
await homeP.waitForTimeout(350);
await homeP.screenshot({ path: path.join(out, 'v21-home-30d.png'), fullPage: false });

await browser.close();
srv.kill();
console.log('saved v21-rank-ladder.png, v21-badges-timeback-300d.png, v21-home-30d.png');
