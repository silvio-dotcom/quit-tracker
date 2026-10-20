#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(out, { recursive: true });
const svg = fs.readFileSync(path.join(root, 'icons/logo.svg'));
await sharp(svg).resize(512, 512).png().toFile(path.join(out, 'quit-tracker-icon-512.png'));
console.log('icon capture done');
