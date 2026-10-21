#!/usr/bin/env node
/**
 * Faithful HTML preview of the Android widget layout (4x2 and 2x2) for artifact capture.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  highestEarnedChip,
  nextChipTarget,
  isAtMaxChip,
} from '../js/chips.js';
import { moneySaved, msSinceQuit, formatDuration } from '../js/stats.js';
import { formatMoney } from '../js/stats.js';
import { CURRENCIES } from '../js/constants.js';
import { xpLevelProgress } from '../js/xp.js';
import { WIDGET_FIXTURE_PROFILE } from '../js/widget-compute.js';
import { renderPixelCoin } from '../js/chip-art.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = '/opt/cursor/artifacts';
const drawable = path.join(repo, 'android/app/src/main/res/drawable-nodpi');
fs.mkdirSync(out, { recursive: true });

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

const logoB64 = fs.readFileSync(path.join(drawable, 'widget_logo.png')).toString('base64');

function stateAt(ms) {
  return {
    profile: {
      quitDate: new Date(Date.now() - ms).toISOString(),
      ...WIDGET_FIXTURE_PROFILE,
    },
    seenAchievements: [],
  };
}

function widgetModel(msElapsed) {
  const state = stateAt(msElapsed);
  const now = Date.now();
  const elapsed = msSinceQuit(state.profile, now);
  const dur = formatDuration(elapsed);
  const days = dur.parts.find((p) => p.u.startsWith('day'));
  const hrs = dur.parts.find((p) => p.u.startsWith('hr'));
  const mins = dur.parts.find((p) => p.u === 'min' || p.u === 'mins');
  let smoke;
  if ((days?.v || 0) >= 1) {
    smoke = `${days.v} ${days.v === 1 ? 'DAY' : 'DAYS'} ${hrs?.v || 0} ${(hrs?.v || 0) === 1 ? 'HR' : 'HRS'}`;
  } else {
    smoke = `${hrs?.v || 0} ${(hrs?.v || 0) === 1 ? 'HR' : 'HRS'} ${mins?.v || 0} MIN`;
  }
  const money = formatMoney(moneySaved(state, now), 'USD', CURRENCIES);
  const xp = xpLevelProgress(state, now);
  const level = `LV ${xp.level}/${xp.maxed ? '20 MAX' : '20'}`;

  let chipLabel;
  let chipEta;
  let chipProgress = 0;
  let tierId = 'chip-24h';
  if (isAtMaxChip(state, now)) {
    chipLabel = '1 YEAR · MAX';
    chipEta = 'Complete';
    chipProgress = 100;
    tierId = 'chip-1y';
  } else {
    const next = nextChipTarget(state, now);
    if (next) {
      chipLabel = `NEXT: ${next.tier.label}`;
      const h = Math.floor(next.remainingMs / MS_H);
      chipEta = h >= 24 ? `${Math.floor(h / 24)}d left` : `${h}h left`;
      chipProgress = Math.round(next.progress);
      tierId = next.tier.id;
    } else {
      const earned = highestEarnedChip(state, now);
      chipLabel = earned?.tier.label || '24 HRS';
      chipEta = '';
      chipProgress = 100;
      tierId = earned?.tier.id || 'chip-24h';
    }
  }

  const drawableName = `widget_coin_${tierId.replace(/-/g, '_')}.png`;
  const coinPath = path.join(drawable, drawableName);
  let coinHtml;
  if (fs.existsSync(coinPath)) {
    const b64 = fs.readFileSync(coinPath).toString('base64');
    coinHtml = `<img src="data:image/png;base64,${b64}" width="28" height="28" style="image-rendering:pixelated" alt=""/>`;
  } else {
    const tier = nextChipTarget(state, now)?.tier || highestEarnedChip(state, now)?.tier;
    coinHtml = tier ? renderPixelCoin(tier, { size: 56, mode: 'earned', idleSpin: false }) : '';
  }

  return { smoke, money, chipLabel, chipEta, chipProgress, level, coinHtml };
}

function htmlFor(model, w, h) {
  const compact = w < 200;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .w{width:${w}px;height:${h}px;background:#0f1419;border:3px solid #334155;box-shadow:4px 4px 0 #1e293b;padding:8px 10px;font-family:'Press Start 2P',monospace;color:#f3f6f9;display:flex;flex-direction:column}
  .body{flex:1;display:flex;flex-direction:column;justify-content:center}
  .head{display:flex;align-items:center;gap:6px;margin-bottom:4px}
  .brand{color:#86efac;font-size:${compact ? 6 : 7}px;flex:1}
  .lv{font-size:6px;color:#22c55e;background:#1c242d;padding:3px 6px}
  .lbl{color:#64748b;font-size:6px}
  .time{font-size:${compact ? 8 : 9}px;margin-top:3px;line-height:1.4}
  .money{color:#22c55e;font-size:${compact ? 7 : 8}px;margin-top:5px}
  .chiprow{display:flex;gap:8px;margin-top:6px;align-items:center}
  .chip{font-size:${compact ? 6 : 7}px;line-height:1.35}
  .eta{color:#86efac;font-size:6px;margin-top:2px}
  .prog{margin-top:8px;height:6px;background:#1c242d;border:1px solid #334155;position:relative}
  .prog>span{display:block;height:100%;background:#22c55e;width:${model.chipProgress}%}
</style></head><body>
<div class="w">
  <div class="head"><img src="data:image/png;base64,${logoB64}" width="22" height="22" style="image-rendering:pixelated" alt=""/>
  <span class="brand">QUIT</span><span class="lv">${model.level}</span></div>
  <div class="body">
  <div class="lbl">SMOKE-FREE</div>
  <div class="time">${model.smoke}</div>
  <div class="money">${model.money}</div>
  <div class="chiprow">${model.coinHtml}<div><div class="chip">${model.chipLabel}</div><div class="eta">${model.chipEta}</div></div></div>
  <div class="prog"><span></span></div>
  </div>
</div></body></html>`;
}

const cases = [
  { name: 'v24-widget-4x2-30h.png', ms: 30 * MS_H, w: 320, h: 148 },
  { name: 'v24-widget-4x2-45d.png', ms: 45 * MS_D, w: 320, h: 148 },
  { name: 'v24-widget-2x2-30h.png', ms: 30 * MS_H, w: 148, h: 148 },
  { name: 'v24-widget-2x2-45d.png', ms: 45 * MS_D, w: 148, h: 148 },
];

const browser = await chromium.launch();
for (const c of cases) {
  const model = widgetModel(c.ms);
  const page = await browser.newPage({ viewport: { width: c.w + 80, height: c.h + 80 }, deviceScaleFactor: 3 });
  await page.setContent(htmlFor(model, c.w, c.h));
  await page.waitForTimeout(200);
  await page.locator('.w').screenshot({ path: path.join(out, c.name) });
  await page.close();
}
await browser.close();
console.log(cases.map((c) => c.name).join(', '));
