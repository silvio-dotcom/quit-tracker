import { msSinceQuit, cigarettesAvoided, moneySaved, formatDuration, formatMoney } from './stats.js';
import { getCurrentRank, rankMetrics } from './ranks.js';
import { CURRENCIES } from './constants.js';
import { buildShareMessage, formatTimeBack } from './share-message.js';
import { isNativePlatform } from './platform.js';
import { highestEarnedChip } from './chips.js';
import { drawChipOnCanvas } from './chip-art.js';

const W = 900;
const H = 1180;

function pixelFrame(ctx, x, y, w, h) {
  ctx.fillStyle = '#1c242d';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3d4f66';
  ctx.lineWidth = 8;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
}

async function loadPixelFont() {
  try {
    await document.fonts.load('16px "Press Start 2P"');
  } catch {
    /* fallback */
  }
}

export async function renderSharePng(state, now = Date.now()) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const ms = msSinceQuit(state.profile, now);
  const dur = formatDuration(ms).label;
  const cigs = cigarettesAvoided(state, now);
  const money = moneySaved(state, now);
  const cur = state.profile.currency || 'USD';
  const timeBack = formatTimeBack(cigs);

  await loadPixelFont();
  ctx.fillStyle = '#0f1419';
  ctx.fillRect(0, 0, W, H);
  pixelFrame(ctx, 40, 40, W - 80, H - 80);

  ctx.fillStyle = '#f3f6f9';
  ctx.font = '28px "Press Start 2P", monospace';
  ctx.fillText('QUIT TRACKER', 72, 120);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#b8c6d6';
  ctx.fillText('Smoke-free progress', 72, 155);

  ctx.fillStyle = '#22c55e';
  ctx.font = '22px "Press Start 2P", monospace';
  ctx.fillText(rank.name.toUpperCase(), 72, 220);

  ctx.fillStyle = '#f3f6f9';
  ctx.font = '36px "Press Start 2P", monospace';
  const durShort = dur.length > 22 ? dur.slice(0, 22) : dur;
  ctx.fillText(durShort, 72, 340);

  const chip = highestEarnedChip(state, now);
  if (chip) {
    await drawChipOnCanvas(ctx, chip.tier, W - 72 - 110, 280, 110);
  }

  const lines = [
    `Cigarettes not smoked: ${cigs.toLocaleString()}`,
    `Money saved: ${formatMoney(money, cur, CURRENCIES)}`,
    `Time back: ${timeBack.replace(' of my time back', '')}`,
  ];
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  let y = 460;
  for (const line of lines) {
    ctx.fillText(line, 72, y);
    y += 48;
  }

  ctx.fillStyle = '#8b9aab';
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillText('QUIT-TRACKER', 72, H - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create image'));
    }, 'image/png');
  });
}

export async function shareProgressPayload(state, text, blob) {
  const file = new File([blob], 'quit-tracker-progress.png', { type: 'image/png' });

  if (navigator.share) {
    try {
      const base = { title: 'My smoke-free progress', text };
      if (navigator.canShare?.({ ...base, files: [file] })) {
        await navigator.share({ ...base, files: [file] });
        return 'shared';
      }
      await navigator.share(base);
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }

  if (isNativePlatform()) {
    const Share = window.Capacitor?.Plugins?.Share;
    if (Share?.share) {
      try {
        await Share.share({ title: 'My smoke-free progress', text, dialogTitle: 'Share my progress' });
        return 'shared';
      } catch {
        /* fall through */
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quit-tracker-progress.png';
    a.click();
    URL.revokeObjectURL(url);
    return 'copy-download';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quit-tracker-progress.png';
  a.click();
  URL.revokeObjectURL(url);
  return 'download';
}

export async function copyShareText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

export function prepareShareContent(state, now = Date.now()) {
  const text = buildShareMessage(state, now);
  return { text, render: () => renderSharePng(state, now) };
}
