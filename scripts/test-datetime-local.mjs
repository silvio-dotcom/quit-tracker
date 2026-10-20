#!/usr/bin/env node
/**
 * Quit datetime-local must round-trip in local time (Silvio: America/Managua UTC-6).
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toDatetimeLocalValue, datetimeLocalNow, quitDateFromDatetimeLocal } from '../js/datetime.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TZ = 'America/Managua';
const MS_PER_DAY = 86400000;

function runNodeRoundTrip() {
  const prev = process.env.TZ;
  process.env.TZ = TZ;
  try {
    const local = datetimeLocalNow();
    const parsed = quitDateFromDatetimeLocal(local);
    if (!parsed.ok) throw new Error(`round-trip parse failed: ${parsed.error}`);
    const elapsed = Date.now() - new Date(parsed.iso).getTime();
    if (elapsed < 0 || elapsed > 120_000) {
      throw new Error(`round-trip elapsed out of range: ${elapsed}ms`);
    }

    const tenDaysAgo = new Date(Date.now() - 10 * MS_PER_DAY);
    const pastLocal = toDatetimeLocalValue(tenDaysAgo);
    const pastParsed = quitDateFromDatetimeLocal(pastLocal);
    if (!pastParsed.ok) throw new Error(pastParsed.error);
    const pastElapsed = Date.now() - new Date(pastParsed.iso).getTime();
    const diff = Math.abs(pastElapsed - 10 * MS_PER_DAY);
    if (diff > 120_000) {
      throw new Error(`past date off by ${diff}ms (expected ~10d)`);
    }

    const future = quitDateFromDatetimeLocal(toDatetimeLocalValue(new Date(Date.now() + MS_PER_DAY)));
    if (future.ok) throw new Error('future quit date should be rejected');
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
  console.log('node TZ round-trip OK');
}

async function dismissRankModals(page) {
  for (let i = 0; i < 12; i++) {
    if (!(await page.locator('#modal-rank-up.open').count())) return;
    await page.locator('[data-close="modal-rank-up"]').click();
    await page.waitForTimeout(280);
  }
}

async function runBrowserManagua() {
  const port = 8781;
  const serveRoot = '/tmp/qt-tz';
  const appRoot = path.join(serveRoot, 'quit-tracker');
  fs.rmSync(serveRoot, { recursive: true, force: true });
  fs.mkdirSync(appRoot, { recursive: true });
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
    timezoneId: TZ,
    locale: 'en-US',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('#modal-setup.open');

  const prefill = await page.inputValue('#setup-quit');
  const browserLocal = await page.evaluate(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  if (prefill !== browserLocal) {
    throw new Error(`setup prefill mismatch: got ${prefill}, expected ${browserLocal}`);
  }

  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForTimeout(500);
  await dismissRankModals(page);

  const elapsedMs = await page.evaluate(() => {
    const raw = localStorage.getItem('quit-tracker-data-v1');
    const data = JSON.parse(raw);
    return Date.now() - new Date(data.profile.quitDate).getTime();
  });
  if (elapsedMs < 0 || elapsedMs > 120_000) {
    throw new Error(`browser elapsed after setup: ${elapsedMs}ms`);
  }

  const pastLocal = await page.evaluate(() => {
    const d = new Date(Date.now() - 10 * 86400000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  await page.locator('.nav-btn[data-nav="more"]').click();
  await page.fill('#settings-quit', pastLocal);
  await page.locator('#settings-form button[type=submit]').click();
  await page.waitForTimeout(400);
  await dismissRankModals(page);

  const pastElapsed = await page.evaluate(() => {
    const raw = localStorage.getItem('quit-tracker-data-v1');
    const data = JSON.parse(raw);
    return Date.now() - new Date(data.profile.quitDate).getTime();
  });
  const pastDiff = Math.abs(pastElapsed - 10 * MS_PER_DAY);
  if (pastDiff > 120_000) throw new Error(`browser past quit off by ${pastDiff}ms`);

  const futureLocal = await page.evaluate(() => {
    const d = new Date(Date.now() + 86400000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const beforeFuture = await page.evaluate(() => JSON.parse(localStorage.getItem('quit-tracker-data-v1')).profile.quitDate);
  await dismissRankModals(page);
  await page.fill('#settings-quit', futureLocal);
  await page.evaluate(() => document.querySelector('#settings-form')?.requestSubmit());
  await page.waitForTimeout(400);
  const toastText = await page.locator('#toast.show').textContent().catch(() => '');
  if (!toastText || !/future/i.test(toastText)) {
    throw new Error(`expected future-date toast, got "${toastText}"`);
  }
  const afterFuture = await page.evaluate(() => JSON.parse(localStorage.getItem('quit-tracker-data-v1')).profile.quitDate);
  if (afterFuture !== beforeFuture) throw new Error('future quit date should not be saved');

  await browser.close();
  srv.kill();
  if (errors.length) throw new Error(errors.join('; '));
  console.log('browser America/Managua OK');
}

runNodeRoundTrip();
await runBrowserManagua();
console.log('all datetime tests passed');
