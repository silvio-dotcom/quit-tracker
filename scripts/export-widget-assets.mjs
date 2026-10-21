#!/usr/bin/env node
/**
 * Rasterize widget coin art for Android (no Playwright — CI-safe).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';
import { renderPixelCoin } from '../js/chip-art.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const drawable = path.join(repo, 'android/app/src/main/res/drawable-nodpi');

fs.mkdirSync(drawable, { recursive: true });

function chipDrawableName(id) {
  return `widget_coin_${id.replace(/-/g, '_')}`;
}

function svgFromCoinHtml(html) {
  const match = html.match(/<svg[\s\S]*?<\/svg>/);
  if (!match) throw new Error('coin SVG missing from renderPixelCoin output');
  return match[0];
}

for (const tier of BASE_SMOKE_FREE_CHIPS) {
  const coinHtml = renderPixelCoin(tier, { size: 72, mode: 'earned', idleSpin: false });
  const svg = svgFromCoinHtml(coinHtml);
  const name = chipDrawableName(tier.id);
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(72, 72, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(drawable, `${name}.png`), png);
}

const logoSrc = path.join(repo, 'icons/icon-192.png');
const logoBuf = await sharp(logoSrc).resize(88, 88, { kernel: sharp.kernel.nearest }).png().toBuffer();
const widgetLogo = await sharp({
  create: {
    width: 96,
    height: 96,
    channels: 4,
    background: { r: 15, g: 20, b: 25, alpha: 1 },
  },
})
  .composite([{ input: logoBuf, left: 4, top: 4 }])
  .png()
  .toBuffer();
fs.writeFileSync(path.join(drawable, 'widget_logo.png'), widgetLogo);

const map = BASE_SMOKE_FREE_CHIPS.map((t) => ({ id: t.id, drawable: chipDrawableName(t.id) }));
fs.writeFileSync(
  path.join(repo, 'android/app/src/main/assets/widget-coin-drawables.json'),
  `${JSON.stringify(map, null, 2)}\n`
);
console.log(`exported ${map.length} coin PNGs + widget_logo.png`);
