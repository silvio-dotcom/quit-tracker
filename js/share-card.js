import { msSinceQuit, cigarettesAvoided, moneySaved, formatDuration, formatMoney } from './stats.js';
import { getCurrentRank, rankMetrics } from './ranks.js';
import { CURRENCIES } from './constants.js';

const W = 900;
const H = 1120;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
  const sym = CURRENCIES[cur]?.symbol ?? '$';

  ctx.fillStyle = '#0f1419';
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 40, 40, W - 80, H - 80, 28);
  ctx.fillStyle = '#1c242d';
  ctx.fill();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#f3f6f9';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('Quit Tracker', 72, 120);
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = '#b8c6d6';
  ctx.fillText('Smoke-free progress', 72, 165);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(`${rank.icon} ${rank.name}`, 72, 250);

  ctx.fillStyle = '#f3f6f9';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(dur, 72, 360);

  const lines = [
    `Cigarettes not smoked: ${cigs.toLocaleString()}`,
    `Money saved: ${formatMoney(money, cur, CURRENCIES)}`,
  ];
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  let y = 460;
  for (const line of lines) {
    ctx.fillText(line, 72, y);
    y += 52;
  }

  ctx.fillStyle = '#8b9aab';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('quit-tracker.app', 72, H - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create image'));
    }, 'image/png');
  });
}

export async function shareProgressCard(state, now = Date.now()) {
  const blob = await renderSharePng(state, now);
  const file = new File([blob], 'quit-tracker-progress.png', { type: 'image/png' });
  const title = 'My smoke-free progress';
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quit-tracker-progress.png';
  a.click();
  URL.revokeObjectURL(url);
  return 'download';
}
