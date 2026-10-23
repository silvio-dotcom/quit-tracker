#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';
import { chipHealthFact } from '../js/chip-health-unlocks.js';
import { renderPixelCoin } from '../js/chip-art.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8791;
const serveRoot = '/tmp/qt-v27-chip-health-mock';
const appRoot = path.join(serveRoot, 'quit-tracker');
const outDir = path.join(repo, 'artifacts');

fs.rmSync(serveRoot, { recursive: true, force: true });
fs.mkdirSync(appRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
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
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
  isMobile: true,
  serviceWorkers: 'block',
});
const page = await context.newPage();

async function captureMock(tierId, filename) {
  const tier = BASE_SMOKE_FREE_CHIPS.find((t) => t.id === tierId);
  const coin = renderPixelCoin(tier, { size: 88, mode: 'earned', idleSpin: false });
  const fact = chipHealthFact(tierId);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="${base}css/styles.css?v=27"/>
  <link rel="stylesheet" href="${base}css/pixel-theme.css?v=27"/>
  <style>body{margin:0;background:#0b1220;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;}</style>
</head>
<body>
  <div class="modal open" style="position:relative;display:block;">
    <div class="modal-backdrop dark" style="position:relative;min-height:auto;padding:0;background:transparent;">
      <div class="modal-panel rank-up-panel chip-health-unlock-panel" style="margin:0 auto;">
        <div class="rank-up-burst" aria-hidden="true"></div>
        <p class="rank-up-label">Health milestone</p>
        <div class="chip-health-unlock-art">${coin}</div>
        <h2 id="chip-health-title">${tier.label}</h2>
        <p class="chip-health-fact">${fact}</p>
        <button type="button" class="btn full">Nice!</button>
      </div>
    </div>
  </div>
</body>
</html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
}

await captureMock('chip-1w', 'chip-health-unlock-1w-mock.png');
await captureMock('chip-1mo', 'chip-health-unlock-1mo-mock.png');

await browser.close();
srv.kill();
console.log('saved artifacts/chip-health-unlock-1w-mock.png and chip-health-unlock-1mo-mock.png');
