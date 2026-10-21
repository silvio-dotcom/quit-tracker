#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_SMOKE_FREE_CHIPS } from '../js/constants.js';
import { renderPixelCoin } from '../js/chip-art.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const drawable = path.join(repo, 'android/app/src/main/res/drawable-nodpi');

fs.mkdirSync(drawable, { recursive: true });

function chipDrawableName(id) {
  return `widget_coin_${id.replace(/-/g, '_')}`;
}

const browser = await chromium.launch();

for (const tier of BASE_SMOKE_FREE_CHIPS) {
  const coinHtml = renderPixelCoin(tier, { size: 72, mode: 'earned', idleSpin: false });
  const page = await browser.newPage({
    viewport: { width: 120, height: 120 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!DOCTYPE html><html><head><style>
      html,body{margin:0;background:transparent}
      body{display:flex;align-items:center;justify-content:center;width:120px;height:120px}
      .pixel-coin-svg{image-rendering:pixelated}
    </style></head><body>${coinHtml}</body></html>`
  );
  await page.waitForSelector('.pixel-coin-svg');
  const box = await page.locator('.pixel-coin-frame').boundingBox();
  if (!box) {
    console.error('coin bbox missing', tier.id);
    process.exit(1);
  }
  const name = chipDrawableName(tier.id);
  await page.locator('.pixel-coin-frame').screenshot({
    path: path.join(drawable, `${name}.png`),
    omitBackground: true,
  });
  await page.close();
}

const logoSrc = path.join(repo, 'icons/icon-192.png');
const logoPage = await browser.newPage({ viewport: { width: 96, height: 96 }, deviceScaleFactor: 2 });
const logoB64 = fs.readFileSync(logoSrc).toString('base64');
await logoPage.setContent(`<!DOCTYPE html><html><head><style>
  body{margin:0;width:96px;height:96px;display:flex;align-items:center;justify-content:center;background:#0f1419}
  img{width:88px;height:88px;image-rendering:pixelated}
</style></head><body><img src="data:image/png;base64,${logoB64}" alt=""/></body></html>`);
await logoPage.waitForTimeout(100);
await logoPage.screenshot({ path: path.join(drawable, 'widget_logo.png'), omitBackground: false });
await logoPage.close();

await browser.close();

const map = BASE_SMOKE_FREE_CHIPS.map((t) => ({ id: t.id, drawable: chipDrawableName(t.id) }));
fs.writeFileSync(
  path.join(repo, 'android/app/src/main/assets/widget-coin-drawables.json'),
  `${JSON.stringify(map, null, 2)}\n`
);
console.log(`exported ${map.length} coin PNGs + widget_logo.png`);
