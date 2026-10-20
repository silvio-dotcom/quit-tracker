#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'icons/logo.svg');
const svg = fs.readFileSync(svgPath);

async function png(size, outPath, padding = 0) {
  const inner = 512 - padding * 2;
  const buf = await sharp(svg)
    .resize(inner, inner)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 15, g: 20, b: 25, alpha: 1 },
    })
    .resize(size, size)
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, buf);
}

async function main() {
  const icons = path.join(root, 'icons');
  await png(192, path.join(icons, 'icon-192.png'), 0);
  await png(512, path.join(icons, 'icon-512.png'), 0);
  await png(512, path.join(icons, 'icon-512-maskable.png'), 64);
  await png(180, path.join(icons, 'apple-touch-icon.png'), 8);
  await png(32, path.join(icons, 'favicon-32.png'), 2);
  await png(1024, path.join(icons, 'icon-1024.png'), 0);
  console.log('icons generated');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
