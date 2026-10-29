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

function renderHtml(outW, outH, logicalW, logicalH, model) {
  const compact = logicalW < 200;
  const S = outW / logicalW;
  const payload = JSON.stringify({ outW, outH, logicalW, logicalH, S, compact, fontB64, showLevel: true, ...model });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0;background:#111}#c{display:block}</style>
</head><body><canvas id="c" width="${outW}" height="${outH}"></canvas>
<script>
const M = ${payload};
const S = M.S;

function drawAccentI(ctx, x, baseline, size, color) {
  const px = Math.max(1, size * 0.12);
  ctx.fillStyle = color;
  const left = x + size * 0.38;
  const top = baseline - size * 0.72;
  ctx.fillRect(left, top, px, px);
  ctx.fillRect(left + px, top - px, px, px);
}

function measureP2(ctx, text, size) {
  ctx.font = size + 'px P2';
  if (text.includes('DÍAS') || text.includes('DÍA')) {
    const norm = text.replace(/DÍAS/g, 'DIAS').replace(/DÍA/g, 'DIA');
    let w = 0;
    for (let i = 0; i < norm.length; i++) w += ctx.measureText(norm[i]).width;
    return w;
  }
  return ctx.measureText(text).width;
}

function drawP2(ctx, text, x, y, size, color, shadow) {
  ctx.font = size + 'px P2';
  ctx.textBaseline = 'alphabetic';
  if (text.includes('DÍAS') || text.includes('DÍA')) {
    const norm = text.replace(/DÍAS/g, 'DIAS').replace(/DÍA/g, 'DIA');
    let cx = x;
    for (let i = 0; i < norm.length; i++) {
      const ch = norm[i];
      if (shadow) { ctx.fillStyle = shadow; ctx.fillText(ch, cx + S, y + S); }
      ctx.fillStyle = color;
      ctx.fillText(ch, cx, y);
      if (ch === 'I') drawAccentI(ctx, cx, y, size, color);
      cx += ctx.measureText(ch).width;
    }
    return;
  }
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, x + S, y + S); }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawP2Centered(ctx, text, cx, y, size, color, shadow) {
  const w = measureP2(ctx, text, size);
  drawP2(ctx, text, cx - w / 2, y, size, color, shadow);
}

function drawBlocks(ctx, x, y, bw, bh, pct) {
  const n = 10;
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * n);
  const gap = 2 * S;
  const blockW = Math.max(4 * S, Math.floor((bw - gap * (n - 1)) / n));
  for (let i = 0; i < n; i++) {
    const bx = x + i * (blockW + gap);
    ctx.fillStyle = '#000';
    ctx.fillRect(bx, y, blockW, bh);
    ctx.fillStyle = i < filled ? '#c84c0c' : '#f8b800';
    ctx.fillRect(bx + 2 * S, y + 2 * S, blockW - 4 * S, bh - 4 * S);
    if (i < filled) {
      ctx.fillStyle = '#7a2b00';
      ctx.fillRect(bx + 2 * S, y + bh - 4 * S, blockW - 4 * S, 2 * S);
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
  await document.fonts.load(Math.ceil(8 * S) + 'px P2');
  await document.fonts.ready;

  const c = document.getElementById('c');
  c.width = M.outW;
  c.height = M.outH;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, M.outW, M.outH);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4 * S;
  ctx.strokeRect(2 * S, 2 * S, M.outW - 4 * S, M.outH - 4 * S);

  const groundH = 10 * S;
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(4 * S, M.outH - groundH - 4 * S, M.outW - 8 * S, groundH);
  ctx.fillStyle = '#000';
  for (let gx = 4 * S; gx < M.outW - 4 * S; gx += 16 * S) ctx.fillRect(gx, M.outH - groundH - 4 * S, 2 * S, groundH);

  const pad = 10 * S;
  let y = pad + 6 * S;
  const logo = await loadImg(M.logoB64);
  if (logo) ctx.drawImage(logo, pad, y - 4 * S, 18 * S, 18 * S);
  drawP2(ctx, 'SIN HUMO', pad + 24 * S, y + 8 * S, 6 * S, '#f8b800', null);

  if (!M.compact && M.showLevel) {
    const lvSize = 7 * S;
    const lvPadX = 4 * S;
    const lvW = measureP2(ctx, M.level, lvSize) + lvPadX * 2;
    const lvH = 14 * S;
    const lvX = M.outW - pad - lvW;
    ctx.fillStyle = '#f8b800';
    ctx.fillRect(lvX, y - 2 * S, lvW, lvH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 * S;
    ctx.strokeRect(lvX, y - 2 * S, lvW, lvH);
    drawP2(ctx, M.level, lvX + lvPadX, y + 8 * S, lvSize, '#000', null);
  }

  y += 24 * S;
  const heroTop = y;
  const coinCol = (M.compact ? 44 : 48) * S;
  const coinX = M.outW - pad - coinCol;
  const coinSize = (M.compact ? 36 : 40) * S;
  const coinCenterX = coinX + coinCol / 2;

  const sz = (M.compact ? 8 : 9) * S;
  drawP2(ctx, M.smoke, pad, y + sz, sz, '#fff', '#1f3c8c');
  y += sz + 5 * S;
  drawP2(ctx, M.money, pad, y + 7 * S, (M.compact ? 7 : 8) * S, '#fce0a8', '#1f3c8c');

  const curCoin = await loadImg(M.currentCoinB64);
  if (curCoin) ctx.drawImage(curCoin, coinCenterX - coinSize / 2, heroTop, coinSize, coinSize);
  const labelSize = (M.compact ? 5 : 6) * S;
  const labelBaseline = heroTop + coinSize + 2 * S + labelSize;
  drawP2Centered(ctx, M.currentLabel, coinCenterX, labelBaseline, labelSize, '#f8b800', '#000');

  if (M.showNext) {
    y += 14 * S;
    const nextRowY = y;
    const nextCoin = await loadImg(M.nextCoinB64);
    const nextCoinSize = 18 * S;
    if (nextCoin) ctx.drawImage(nextCoin, pad, nextRowY, nextCoinSize, nextCoinSize);
    drawP2(ctx, M.sigLine, pad + 22 * S, nextRowY + 14 * S, (M.compact ? 5 : 6) * S, '#fff', '#1f3c8c');
    y += 18 * S;
    drawBlocks(ctx, pad, y, M.outW - pad * 2, 8 * S, M.progress);
  }

  const px = ctx.getImageData(Math.floor(8 * S), Math.floor(8 * S), 1, 1).data;
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

function assertPngNotBlank(filePath, minBytes = 2000) {
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

/** ~3× device density: 4×2 ≈ 1100×509 px (320×148 dp logical). */
const WIDE_SCALE = 1100 / 320;

const scenarios = [
  { tag: '12h', ms: 12 * MS_H },
  { tag: '30h', ms: 30 * MS_H },
  { tag: '45d', ms: 45 * MS_D },
  { tag: '400d', ms: 400 * MS_D },
];

const sizes = [
  { suffix: '4x2', logicalW: 320, logicalH: 148, outW: 1100, outH: Math.round(148 * WIDE_SCALE) },
  {
    suffix: '2x2',
    logicalW: 148,
    logicalH: 148,
    outW: Math.round(148 * WIDE_SCALE),
    outH: Math.round(148 * WIDE_SCALE),
  },
];

const browser = await chromium.launch();
for (const sc of scenarios) {
  const model = widgetModel(sc.ms);
  for (const sz of sizes) {
    const name = `v29-widget-${sz.suffix}-${sc.tag}.png`;
    const outPath = path.join(out, name);
    const page = await browser.newPage({
      viewport: { width: sz.outW + 40, height: sz.outH + 40 },
      deviceScaleFactor: 1,
    });
    await page.setContent(renderHtml(sz.outW, sz.outH, sz.logicalW, sz.logicalH, model), {
      waitUntil: 'domcontentloaded',
    });
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
