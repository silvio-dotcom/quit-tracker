#!/usr/bin/env node
/**
 * Faithful HTML preview of the Android widget layout (4x2 and 2x2) for artifact capture.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import {
  highestEarnedChip,
  nextChipTarget,
  isAtMaxChip,
} from '../js/chips.js';
import { moneySaved, msSinceQuit, formatDuration } from '../js/stats.js';
import { formatMoney } from '../js/stats.js';
import { CURRENCIES } from '../js/constants.js';
import { xpLevelProgress } from '../js/xp.js';

const out = '/opt/cursor/artifacts';
fs.mkdirSync(out, { recursive: true });

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

function stateAt(ms) {
  return {
    profile: {
      quitDate: new Date(Date.now() - ms).toISOString(),
      cigsPerDay: 15,
      cigsPerPack: 20,
      packPrice: 12,
      currency: 'USD',
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
  let rim = '#0e7490';
  if (isAtMaxChip(state, now)) {
    chipLabel = '1 YEAR · MAX';
    chipEta = 'Complete';
    rim = '#8b4513';
  } else {
    const next = nextChipTarget(state, now);
    const earned = highestEarnedChip(state, now);
    if (next) {
      chipLabel = `NEXT: ${next.tier.label}`;
      const h = Math.floor(next.remainingMs / MS_H);
      chipEta = h >= 24 ? `${Math.floor(h / 24)}d left` : `${h}h left`;
      rim = next.tier.palette.rim;
    } else if (earned) {
      chipLabel = earned.tier.label;
      chipEta = '';
      rim = earned.tier.palette.rim;
    }
  }
  return { smoke, money, chipLabel, chipEta, rim, level };
}

function htmlFor(model, w, h) {
  const compact = w < 200;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .w{width:${w}px;height:${h}px;background:#0f1419;border:3px solid #334155;box-shadow:4px 4px 0 #1e293b;padding:10px;font-family:'Press Start 2P',monospace;color:#f3f6f9;display:flex;flex-direction:column}
  .head{display:flex;align-items:center;gap:6px;margin-bottom:6px}
  .brand{color:#86efac;font-size:${compact ? 6 : 7}px;flex:1}
  .lv{font-size:6px;color:#22c55e;background:#1c242d;padding:3px 6px}
  .lbl{color:#64748b;font-size:6px}
  .time{font-size:${compact ? 8 : 9}px;margin-top:4px;line-height:1.4}
  .money{color:#22c55e;font-size:${compact ? 7 : 8}px;margin-top:8px}
  .chiprow{display:flex;gap:8px;margin-top:${compact ? 6 : 8}px;align-items:center}
  .coin{width:22px;height:22px;border-radius:50%;background:${model.rim};border:2px solid #1a1228;flex-shrink:0}
  .chip{font-size:${compact ? 6 : 7}px;line-height:1.35}
  .eta{color:#86efac;font-size:6px;margin-top:3px}
</style></head><body>
<div class="w">
  <div class="head"><span style="width:14px;height:14px;background:#22c55e;border-radius:3px;display:inline-block"></span>
  <span class="brand">QUIT</span><span class="lv">${model.level}</span></div>
  <div class="lbl">SMOKE-FREE</div>
  <div class="time">${model.smoke}</div>
  <div class="money">${model.money}</div>
  <div class="chiprow"><div class="coin"></div><div><div class="chip">${model.chipLabel}</div><div class="eta">${model.chipEta}</div></div></div>
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
