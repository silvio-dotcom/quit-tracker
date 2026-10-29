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
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.QT_ARTIFACTS_DIR || '/opt/cursor/artifacts';
const repoArtifacts = path.join(repo, 'artifacts');
const drawable = path.join(repo, 'android/app/src/main/res/drawable-nodpi');
const fontPath = path.join(repo, 'fonts/PressStart2P-Regular.ttf').replace(/\\/g, '/');
fs.mkdirSync(out, { recursive: true });

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

const logoB64 = fs.readFileSync(path.join(drawable, 'widget_logo.png')).toString('base64');

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
  const level = `LV ${xp.level}/20`;

  const earned = highestEarnedChip(state, now);
  const next = nextChipTarget(state, now);
  const atMax = isAtMaxChip(state, now);

  let currentLabel;
  let currentTierId;
  if (atMax) {
    currentLabel = 'MAX';
    currentTierId = 'chip-1y';
  } else if (earned) {
    currentLabel = earned.tier.label;
    currentTierId = earned.tier.id;
  } else {
    currentLabel = 'SIN MEDALLA';
    currentTierId = 'chip-24h';
  }

  let showNext = !atMax;
  let sigLine = '';
  let progress = 100;
  let nextTierId = 'chip-24h';
  if (showNext && next) {
    nextTierId = next.tier.id;
    const h = Math.floor(next.remainingMs / MS_H);
    const eta = h >= 24 ? `${Math.floor(h / 24)} d` : `${h} h`;
    sigLine = `SIG.: ${next.tier.label} · ${eta}`;
    progress = Math.round(next.progress);
  }

  return { smoke, money, level, currentLabel, currentTierId, nextTierId, showNext, sigLine, progress, logoB64 };
}

function renderHtml(w, h, model) {
  const compact = w < 200;
  const data = JSON.stringify({ w, h, compact, ...model });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#222;display:flex;align-items:center;justify-content:center;min-height:100vh}</style>
</head><body><canvas id="c"></canvas>
<script>
const M = ${data};
const fontUrl = 'file://${fontPath}';

function drawAccentI(ctx, x, baseline, size, color) {
  const px = Math.max(1, size * 0.1);
  ctx.fillStyle = color;
  const left = x + size * 0.38;
  const top = baseline - size * 0.72;
  ctx.fillRect(left, top, px, px);
  ctx.fillRect(left + px, top - px, px, px);
}

function drawP2(ctx, text, x, y, size, color, shadow) {
  ctx.font = size + 'px P2';
  ctx.textBaseline = 'alphabetic';
  if (text.includes('DÍAS') || text.includes('DÍA')) {
    const norm = text.replace(/DÍAS/g, 'DIAS').replace(/DÍA/g, 'DIA');
    let cx = x;
    for (let i = 0; i < norm.length; i++) {
      const ch = norm[i];
      if (shadow) { ctx.fillStyle = shadow; ctx.fillText(ch, cx + 1, y + 1); }
      ctx.fillStyle = color;
      ctx.fillText(ch, cx, y);
      if (ch === 'I') drawAccentI(ctx, cx, y, size, color);
      cx += ctx.measureText(ch).width;
    }
    return cx;
  }
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, x + 1, y + 1); }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  return x + ctx.measureText(text).width;
}

function drawBlocks(ctx, x, y, w, h, pct) {
  const n = 10;
  const filled = Math.round((pct / 100) * n);
  const gap = 2;
  const bw = Math.floor((w - gap * (n - 1)) / n);
  for (let i = 0; i < n; i++) {
    const bx = x + i * (bw + gap);
    ctx.fillStyle = '#000';
    ctx.fillRect(bx, y, bw, h);
    ctx.fillStyle = i < filled ? '#c84c0c' : '#f8b800';
    ctx.fillRect(bx + 2, y + 2, bw - 4, h - 4);
    if (i < filled) {
      ctx.fillStyle = '#7a2b00';
      ctx.fillRect(bx + 2, y + h - 4, bw - 4, 2);
    }
  }
}

async function paint() {
  const ff = new FontFace('P2', 'url(' + fontUrl + ')');
  await ff.load();
  document.fonts.add(ff);
  const c = document.getElementById('c');
  const dpr = 3;
  c.width = M.w * dpr;
  c.height = M.h * dpr;
  c.style.width = M.w + 'px';
  c.style.height = M.h + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, M.w, M.h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, M.w - 4, M.h - 4);

  const groundH = 10;
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(4, M.h - groundH - 4, M.w - 8, groundH);
  ctx.fillStyle = '#000';
  for (let gx = 4; gx < M.w - 4; gx += 16) ctx.fillRect(gx, M.h - groundH - 4, 2, groundH);

  const pad = 10;
  let y = pad + 8;
  const img = new Image();
  img.src = 'data:image/png;base64,' + M.logoB64;
  await img.decode();
  ctx.drawImage(img, pad, y - 6, 18, 18);
  ctx.font = '700 11px sans-serif';
  ctx.fillStyle = '#f8b800';
  ctx.fillText('SIN HUMO', pad + 24, y + 6);
  const lvW = 68;
  const lvX = M.w - pad - lvW;
  ctx.fillStyle = '#f8b800';
  ctx.fillRect(lvX, y - 2, lvW, 14);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(lvX, y - 2, lvW, 14);
  drawP2(ctx, M.level, lvX + 4, y + 8, M.compact ? 6 : 7, '#000', null);

  y += 22;
  const sz = M.compact ? 8 : 9;
  drawP2(ctx, M.smoke, pad, y + sz, sz, '#fff', '#1f3c8c');
  y += sz + 6;
  drawP2(ctx, M.money, pad, y + 7, M.compact ? 7 : 8, '#fce0a8', '#1f3c8c');

  drawP2(ctx, M.currentLabel, M.w - pad - 58, y + 4, 5, '#f8b800', '#000');

  if (M.showNext) {
    y += 16;
    drawP2(ctx, M.sigLine, pad, y + 7, M.compact ? 6 : 7, '#fff', '#1f3c8c');
    y += 12;
    drawBlocks(ctx, pad, y, M.w - pad * 2, 8, M.progress);
  }
}
paint();
</script></body></html>`;
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
    const page = await browser.newPage({ viewport: { width: sz.w + 40, height: sz.h + 40 }, deviceScaleFactor: 1 });
    await page.setContent(renderHtml(sz.w, sz.h, model));
    await page.waitForFunction(() => document.fonts.check('8px P2'));
    await page.waitForTimeout(200);
    await page.locator('#c').screenshot({ path: path.join(out, name) });
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
