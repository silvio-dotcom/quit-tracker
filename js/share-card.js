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
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 12;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#fce0a8';
  ctx.fillRect(x + 24, y + 24, w - 48, h - 48);
  ctx.strokeStyle = '#c84c0c';
  ctx.lineWidth = 8;
  ctx.strokeRect(x + 32, y + 32, w - 64, h - 64);
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
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, W, H);
  pixelFrame(ctx, 40, 40, W - 80, H - 80);

  ctx.fillStyle = '#1f3c8c';
  ctx.font = '28px "Press Start 2P", monospace';
  ctx.fillText('SIN HUMO', 72, 120);
  ctx.font = '600 22px "Pixelify Sans", system-ui, sans-serif';
  ctx.fillStyle = '#7a2b00';
  ctx.fillText('Progreso sin fumar', 72, 155);

  ctx.fillStyle = '#c84c0c';
  ctx.font = '600 26px "Pixelify Sans", system-ui, sans-serif';
  ctx.fillText(rank.name, 72, 220);

  ctx.fillStyle = '#111';
  ctx.font = '36px "Press Start 2P", monospace';
  const durShort = dur.length > 22 ? dur.slice(0, 22) : dur;
  ctx.fillText(durShort, 72, 340);

  const chip = highestEarnedChip(state, now);
  if (chip) {
    await drawChipOnCanvas(ctx, chip.tier, W - 72 - 110, 280, 110);
  }

  const lines = [
    `Cigarrillos sin fumar: ${cigs.toLocaleString('es-419')}`,
    `Dinero ahorrado: ${formatMoney(money, cur, CURRENCIES)}`,
    `Tiempo recuperado: ${timeBack.replace(' de mi tiempo recuperado', '')}`,
  ];
  ctx.font = '22px "Pixelify Sans", system-ui, sans-serif';
  ctx.fillStyle = '#111';
  let y = 460;
  for (const line of lines) {
    ctx.fillText(line, 72, y);
    y += 48;
  }

  ctx.fillStyle = '#7a2b00';
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillText('SIN-HUMO', 72, H - 72);

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
      const base = { title: 'Mi progreso sin fumar', text };
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
        await Share.share({ title: 'Mi progreso sin fumar', text, dialogTitle: 'Compartir mi progreso' });
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
