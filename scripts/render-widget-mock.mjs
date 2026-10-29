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

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.QT_ARTIFACTS_DIR || path.join(repo, 'artifacts');
const repoArtifacts = path.join(repo, 'artifacts');
const drawable = path.join(repo, 'android/app/src/main/res/drawable-nodpi');
fs.mkdirSync(out, { recursive: true });

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

const fontB64 = fs.readFileSync(path.join(repo, 'fonts/PressStart2P-Regular.ttf')).toString('base64');
const logoB64 = fs.readFileSync(path.join(drawable, 'widget_logo.png')).toString('base64');

function coinB64(tierId) {
  const name = tierId ? `widget_coin_${tierId.replace(/-/g, '_')}.png` : 'widget_coin_slot_empty.png';
  const p = path.join(drawable, name);
  if (fs.existsSync(p)) return fs.readFileSync(p).toString('base64');
  return null;
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

  return {
    smoke,
    money,
    level,
    currentLabel,
    currentCoinB64: coinB64(currentTierId),
    nextCoinB64: showNext ? coinB64(nextTierId) : null,
    showNext,
    sigLine,
    progress,
    logoB64,
  };
}

function renderHtml(w, h, model) {
  const compact = w < 200;
  const payload = JSON.stringify({ w, h, compact, fontB64, ...model });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0;background:#111}#c{display:block}</style>
</head><body><canvas id="c" width="${w}" height="${h}"></canvas>
<script>
const M = ${payload};

function drawAccentI(ctx, x, baseline, size, color) {
  const px = Math.max(1, size * 0.12);
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
    return;
  }
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, x + 1, y + 1); }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawBlocks(ctx, x, y, bw, bh, pct) {
  const n = 10;
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * n);
  const gap = 2;
  const blockW = Math.max(4, Math.floor((bw - gap * (n - 1)) / n));
  for (let i = 0; i < n; i++) {
    const bx = x + i * (blockW + gap);
    ctx.fillStyle = '#000';
    ctx.fillRect(bx, y, blockW, bh);
    ctx.fillStyle = i < filled ? '#c84c0c' : '#f8b800';
    ctx.fillRect(bx + 2, y + 2, blockW - 4, bh - 4);
    if (i < filled) {
      ctx.fillStyle = '#7a2b00';
      ctx.fillRect(bx + 2, y + bh - 4, blockW - 4, 2);
    }
  }
}

async function loadImg(b64) {
  if (!b64) return null;
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  return img;
}

async function paint() {
  const ff = new FontFace('P2', 'url(data:font/ttf;base64,' + M.fontB64 + ')');
  await ff.load();
  document.fonts.add(ff);
  await document.fonts.load('8px P2');
  await document.fonts.ready;

  const c = document.getElementById('c');
  c.width = M.w;
  c.height = M.h;
  const ctx = c.getContext('2d');
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
  let y = pad + 6;
  const logo = await loadImg(M.logoB64);
  if (logo) ctx.drawImage(logo, pad, y - 4, 18, 18);
  ctx.font = '700 11px sans-serif';
  ctx.fillStyle = '#f8b800';
  ctx.fillText('SIN HUMO', pad + 24, y + 8);

  const lvW = 68;
  const lvX = M.w - pad - lvW;
  ctx.fillStyle = '#f8b800';
  ctx.fillRect(lvX, y - 2, lvW, 14);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(lvX, y - 2, lvW, 14);
  drawP2(ctx, M.level, lvX + 4, y + 8, M.compact ? 6 : 7, '#000', null);

  y += 24;
  const coinCol = M.compact ? 44 : 48;
  const textW = M.w - pad * 2 - coinCol - 6;
  const sz = M.compact ? 8 : 9;
  drawP2(ctx, M.smoke, pad, y + sz, sz, '#fff', '#1f3c8c');
  y += sz + 5;
  drawP2(ctx, M.money, pad, y + 7, M.compact ? 7 : 8, '#fce0a8', '#1f3c8c');

  const curCoin = await loadImg(M.currentCoinB64);
  const coinX = M.w - pad - coinCol;
  const coinSize = M.compact ? 36 : 40;
  if (curCoin) ctx.drawImage(curCoin, coinX + (coinCol - coinSize) / 2, pad + 22, coinSize, coinSize);
  drawP2(ctx, M.currentLabel, coinX, y - 2, 5, '#f8b800', '#000');

  if (M.showNext) {
    y += 14;
    const nextCoin = await loadImg(M.nextCoinB64);
    if (nextCoin) ctx.drawImage(nextCoin, pad, y, 18, 18);
    drawP2(ctx, M.sigLine, pad + 22, y + 14, M.compact ? 5 : 6, '#fff', '#1f3c8c');
    y += 18;
    drawBlocks(ctx, pad, y, M.w - pad * 2, 8, M.progress);
  }

  const px = ctx.getImageData(8, 8, 1, 1).data;
  if (px[2] < 200) throw new Error('sky pixel check failed');
  window.__WIDGET_PAINT_OK__ = true;
}

paint().catch((e) => { window.__WIDGET_PAINT_ERR__ = String(e && e.message ? e.message : e); });
</script></body></html>`;
}

function writePngFromDataUrl(dataUrl, filePath) {
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
}

function assertPngNotBlank(filePath, minBytes = 800) {
  const stat = fs.statSync(filePath);
  if (stat.size < minBytes) {
    throw new Error(`${filePath}: file too small (${stat.size} bytes)`);
  }
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24) throw new Error(`${filePath}: invalid PNG`);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w <= 300 && h <= 150 && stat.size < 2000) {
    throw new Error(`${filePath}: looks like default blank canvas ${w}x${h}`);
  }
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
    const outPath = path.join(out, name);
    const page = await browser.newPage({
      viewport: { width: sz.w + 20, height: sz.h + 20 },
      deviceScaleFactor: 1,
    });
    await page.setContent(renderHtml(sz.w, sz.h, model), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__WIDGET_PAINT_OK__ === true || window.__WIDGET_PAINT_ERR__, null, {
      timeout: 15000,
    });
    const err = await page.evaluate(() => window.__WIDGET_PAINT_ERR__);
    if (err) {
      await page.close();
      throw new Error(`${name}: paint failed: ${err}`);
    }
    const dataUrl = await page.evaluate(() => {
      const c = document.getElementById('c');
      return c.toDataURL('image/png');
    });
    writePngFromDataUrl(dataUrl, outPath);
    assertPngNotBlank(outPath);
    await page.close();
    console.log('wrote', outPath);
  }
}
await browser.close();

const previewSrc = path.join(out, 'v29-widget-4x2-45d.png');
fs.mkdirSync(repoArtifacts, { recursive: true });
fs.copyFileSync(previewSrc, path.join(drawable, 'widget_preview.png'));
fs.copyFileSync(previewSrc, path.join(out, 'v29-widget-preview.png'));
fs.copyFileSync(previewSrc, path.join(repoArtifacts, 'widget-v29-plataformas.png'));
assertPngNotBlank(path.join(drawable, 'widget_preview.png'));
console.log('saved v29 widget mocks + widget_preview.png + artifacts/widget-v29-plataformas.png');
