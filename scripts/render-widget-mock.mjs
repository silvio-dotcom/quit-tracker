#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { highestEarnedChip, nextChipTarget, isAtMaxChip } from '../js/chips.js';
import { moneySaved, msSinceQuit, formatDuration } from '../js/stats.js';
import { formatMoney } from '../js/stats.js';
import { CURRENCIES } from '../js/constants.js';
import { xpLevelProgress } from '../js/xp.js';
import { WIDGET_FIXTURE_PROFILE } from '../js/widget-compute.js';
import { renderPixelCoin } from '../js/chip-art.js';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.QT_ARTIFACTS_DIR || '/opt/cursor/artifacts';
const repoArtifacts = path.join(repo, 'artifacts');
const drawable = path.join(repo, 'android/app/src/main/res/drawable-nodpi');
fs.mkdirSync(out, { recursive: true });

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

const logoB64 = fs.readFileSync(path.join(drawable, 'widget_logo.png')).toString('base64');

function coinImg(tierId, locked = false) {
  const tier = BASE_SMOKE_FREE_CHIPS.find((t) => t.id === tierId) || BASE_SMOKE_FREE_CHIPS[0];
  const mode = locked ? 'locked' : 'earned';
  const html = renderPixelCoin(tier, { size: 72, mode, idleSpin: false });
  const file = locked
    ? 'widget_coin_slot_empty.png'
    : `widget_coin_${tierId.replace(/-/g, '_')}.png`;
  const p = path.join(drawable, file);
  if (fs.existsSync(p)) {
    return `<img src="data:image/png;base64,${fs.readFileSync(p).toString('base64')}" alt=""/>`;
  }
  return html;
}

function stateAt(ms) {
  return {
    profile: { quitDate: new Date(Date.now() - ms).toISOString(), ...WIDGET_FIXTURE_PROFILE },
    seenAchievements: [],
  };
}

function widgetModel(msElapsed) {
  const state = stateAt(msElapsed);
  const now = Date.now();
  const elapsed = msSinceQuit(state.profile, now);
  const dur = formatDuration(elapsed);
  const days = dur.parts.find((p) => p.u.startsWith('día') || p.u === 'días');
  const hrs = dur.parts.find((p) => p.u.startsWith('hora') || p.u === 'horas');
  const mins = dur.parts.find((p) => p.u === 'min');
  let smoke;
  if ((days?.v || 0) >= 1) {
    smoke = `${days.v} ${days.v === 1 ? 'DÍA' : 'DÍAS'} ${hrs?.v || 0} H`;
  } else {
    smoke = `${hrs?.v || 0} H ${mins?.v || 0} MIN`;
  }
  const money = formatMoney(moneySaved(state, now), 'USD', CURRENCIES);
  const xp = xpLevelProgress(state, now);
  const level = `LV ${xp.level}/${xp.maxed ? '20 MAX' : '20'}`;

  const earned = highestEarnedChip(state, now);
  const next = nextChipTarget(state, now);
  const atMax = isAtMaxChip(state, now);

  let currentLabel;
  let currentTierId;
  let currentLocked = false;
  if (atMax) {
    currentLabel = 'MAX';
    currentTierId = 'chip-1y';
  } else if (earned) {
    currentLabel = earned.tier.label;
    currentTierId = earned.tier.id;
  } else {
    currentLabel = 'SIN MEDALLA';
    currentTierId = 'chip-24h';
    currentLocked = true;
  }

  let showNext = !atMax;
  let nextLabel = '';
  let nextEta = '';
  let progress = 100;
  let nextTierId = 'chip-24h';
  if (showNext && next) {
    nextTierId = next.tier.id;
    nextLabel = `SIG.: ${next.tier.label}`;
    const h = Math.floor(next.remainingMs / MS_H);
    nextEta = h >= 24 ? `${Math.floor(h / 24)}d` : `${h}h`;
    progress = Math.round(next.progress);
  }

  return {
    smoke,
    money,
    level,
    currentLabel,
    currentCoin: coinImg(currentTierId, currentLocked),
    currentSize: 40,
    showNext,
    nextLabel,
    nextEta,
    nextCoin: coinImg(nextTierId, false),
    progress,
  };
}

function htmlFor(model, w, h) {
  const compact = w < 200;
  const nextBlock = model.showNext
    ? `<div class="nextrow">${model.nextCoin.replace('alt=""', 'class="nextcoin" alt=""')}<div><div class="chip">${model.nextLabel}</div><div class="eta">${model.nextEta}</div></div></div>
       <div class="prog"><span style="width:${model.progress}%"></span></div>`
    : `<div class="prog"><span style="width:100%"></span></div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @font-face{font-family:P2;src:url('file://${path.join(repo, 'fonts/PressStart2P-Regular.ttf')}')}
  @font-face{font-family:PX;src:url('file://${path.join(repo, 'fonts/PixelifySans-latin-600.woff2')}') format('woff2')}
  .ia{position:relative;display:inline-block}.ia::after{content:"";position:absolute;left:.375em;top:-.375em;width:.125em;height:.125em;background:currentColor;box-shadow:.125em -.125em 0 currentColor}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .w{width:${w}px;height:${h}px;background:#5c94fc;border:4px solid #000;padding:8px 10px;font-family:P2,monospace;color:#fff;display:flex;flex-direction:column;justify-content:center;text-shadow:2px 2px 0 #1f3c8c}
  .head{display:flex;align-items:center;gap:6px;margin-bottom:6px}
  .brand{color:#f8b800;font-size:${compact ? 6 : 7}px;flex:1;font-family:PX,sans-serif;font-weight:700}
  .lv{font-size:6px;color:#000;background:#f8b800;padding:3px 6px;border:2px solid #000;text-shadow:none}
  .hero{display:flex;gap:8px;align-items:flex-start}
  .stats{flex:1;min-width:0}
  .time{font-size:${compact ? 8 : 9}px;line-height:1.35}
  .money{color:#fce0a8;font-size:${compact ? 7 : 8}px;margin-top:4px}
  .curcol{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:${compact ? 64 : 72}px}
  .curcoin{width:${model.currentSize}px;height:${model.currentSize}px;image-rendering:pixelated}
  .curlbl{font-size:5px;color:#f8b800;margin-top:2px;text-align:center;line-height:1.3;max-width:72px;text-shadow:1px 1px 0 #000}
  .nextrow{display:flex;gap:6px;margin-top:6px;align-items:center}
  .nextcoin{width:22px;height:22px;image-rendering:pixelated}
  .chip{font-size:${compact ? 6 : 7}px;line-height:1.3}
  .eta{color:#fce0a8;font-size:6px;margin-top:1px;font-family:PX,sans-serif;font-weight:600;text-shadow:1px 1px 0 #000}
  .prog{margin-top:6px;height:8px;background:#7a2b00;border:2px solid #000}
  .prog>span{display:block;height:100%;background:#f8b800;box-shadow:inset -2px -2px 0 #c84c0c}
  img{object-fit:contain}
</style></head><body>
<div class="w">
  <div class="head"><img src="data:image/png;base64,${logoB64}" width="20" height="20" style="image-rendering:pixelated" alt=""/>
  <span class="brand">SIN HUMO</span><span class="lv">${model.level}</span></div>
  <div class="hero">
    <div class="stats">
      <div class="time">${model.smoke.replace(/DÍAS/g, 'D<span class="ia">I</span>AS').replace(/DÍA/g, 'D<span class="ia">I</span>A')}</div>
      <div class="money">${model.money}</div>
    </div>
    <div class="curcol">${model.currentCoin.replace('alt=""', 'class="curcoin" alt=""')}<div class="curlbl">${model.currentLabel}</div></div>
  </div>
  ${nextBlock}
</div></body></html>`;
}

const scenarios = [
  { tag: '12h', ms: 12 * MS_H },
  { tag: '30h', ms: 30 * MS_H },
  { tag: '45d', ms: 45 * MS_D },
  { tag: '400d', ms: 400 * MS_D },
];

const sizes = [
  { suffix: '4x2', w: 320, h: 148 },
  { suffix: '2x2', w: 148, h: 148 },
];

const browser = await chromium.launch();
for (const sc of scenarios) {
  const model = widgetModel(sc.ms);
  for (const sz of sizes) {
    const name = `v29-widget-${sz.suffix}-${sc.tag}.png`;
    const page = await browser.newPage({ viewport: { width: sz.w + 80, height: sz.h + 80 }, deviceScaleFactor: 3 });
    await page.setContent(htmlFor(model, sz.w, sz.h));
    await page.waitForTimeout(150);
    await page.locator('.w').screenshot({ path: path.join(out, name) });
    await page.close();
  }
}
await browser.close();

const previewSrc = path.join(out, 'v29-widget-4x2-45d.png');
fs.mkdirSync(repoArtifacts, { recursive: true });
fs.copyFileSync(previewSrc, path.join(drawable, 'widget_preview.png'));
fs.copyFileSync(previewSrc, path.join(out, 'v29-widget-preview.png'));
fs.copyFileSync(previewSrc, path.join(repoArtifacts, 'widget-v29-plataformas.png'));
console.log('saved v29 widget mocks + widget_preview.png + artifacts/widget-v29-plataformas.png');
