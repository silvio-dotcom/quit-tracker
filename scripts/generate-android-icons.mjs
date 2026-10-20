#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidRes = path.join(root, 'android/app/src/main/res');
const svg = fs.readFileSync(path.join(root, 'icons/logo.svg'));
const monoSvg = fs.readFileSync(path.join(root, 'icons/logo-monochrome.svg'));

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

async function writePng(size, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(svg).resize(size, size).png().toFile(file);
}

async function main() {
  if (!fs.existsSync(androidRes)) {
    console.log('android res missing — run cap add android first');
    return;
  }
  for (const [folder, size] of Object.entries(densities)) {
    const dir = path.join(androidRes, `mipmap-${folder}`);
    await writePng(size, path.join(dir, 'ic_launcher.png'));
    await writePng(size, path.join(dir, 'ic_launcher_round.png'));
    const mono = Math.round(size * 0.55);
    await sharp(monoSvg).resize(mono, mono).png().toFile(path.join(dir, 'ic_launcher_monochrome.png'));
    const fg = Math.round(size * 0.62);
    await sharp(svg)
      .resize(fg, fg)
      .extend({
        top: Math.round((size - fg) / 2),
        bottom: Math.round((size - fg) / 2),
        left: Math.round((size - fg) / 2),
        right: Math.round((size - fg) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
  const anydpi = path.join(androidRes, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpi, { recursive: true });
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpi, 'ic_launcher.xml'), adaptive);
  fs.writeFileSync(path.join(anydpi, 'ic_launcher_round.xml'), adaptive);
  const bgPath = path.join(androidRes, 'values/ic_launcher_background.xml');
  fs.writeFileSync(
    bgPath,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0F1419</color>\n</resources>\n`
  );
  const splashSizes = {
    'drawable': 480,
    'drawable-port-mdpi': 320,
    'drawable-port-hdpi': 480,
    'drawable-port-xhdpi': 720,
    'drawable-port-xxhdpi': 960,
    'drawable-port-xxxhdpi': 1280,
    'drawable-land-mdpi': 320,
    'drawable-land-hdpi': 480,
    'drawable-land-xhdpi': 720,
    'drawable-land-xxhdpi': 960,
    'drawable-land-xxxhdpi': 1280,
  };
  for (const [folder, height] of Object.entries(splashSizes)) {
    const width = folder.includes('land') ? height * 2 : Math.round(height * 0.56);
    const h = folder === 'drawable' ? 800 : height;
    const w = folder === 'drawable' ? 480 : width;
    const logo = Math.round(Math.min(w, h) * 0.42);
    const dir = path.join(androidRes, folder);
    fs.mkdirSync(dir, { recursive: true });
    const logoBuf = await sharp(svg).resize(logo, logo).png().toBuffer();
    await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 15, g: 20, b: 25, alpha: 1 } },
    })
      .composite([{ input: logoBuf, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'splash.png'));
  }
  console.log('android launcher icons updated');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
