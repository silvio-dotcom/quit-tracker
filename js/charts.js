function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

function drawBars(canvas, labels, values, color) {
  const { ctx, w, h } = setupCanvas(canvas);
  const pad = { l: 8, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...values);
  const barW = (w - pad.l - pad.r) / values.length;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, w, h);

  values.forEach((v, i) => {
    const bh = ((h - pad.t - pad.b) * v) / max;
    const x = pad.l + i * barW + barW * 0.15;
    const bw = barW * 0.7;
    const y = h - pad.b - bh;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, bw, bh);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  const step = labels.length > 10 ? 2 : 1;
  labels.forEach((lab, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    const x = pad.l + i * barW + barW / 2;
    ctx.fillText(lab, x, h - 6);
  });
}

function drawLine(canvas, labels, values, color) {
  const { ctx, w, h } = setupCanvas(canvas);
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const max = Math.max(1, ...values);
  const min = 0;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 3; g++) {
    const y = pad.t + (innerH * g) / 3;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  }

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad.l + (innerW * i) / (values.length - 1 || 1);
    const y = pad.t + innerH - ((v - min) / (max - min || 1)) * innerH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.lineTo(pad.l + innerW, pad.t + innerH);
  ctx.lineTo(pad.l, pad.t + innerH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.t, 0, h);
  grad.addColorStop(0, color.replace('1)', '0.25)').replace('rgb', 'rgba').replace('#22c55e', 'rgba(34,197,94,0.25)'));
  ctx.fillStyle = 'rgba(34,197,94,0.12)';
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  const step = labels.length > 10 ? 2 : 1;
  labels.forEach((lab, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    const x = pad.l + (innerW * i) / (labels.length - 1 || 1);
    ctx.fillText(lab, x, h - 6);
  });
}

export function renderCharts(series) {
  const c1 = document.getElementById('chart-cravings');
  const c2 = document.getElementById('chart-slips');
  const c3 = document.getElementById('chart-money');
  if (c1) drawBars(c1, series.labels, series.cravings, '#38bdf8');
  if (c2) drawBars(c2, series.labels, series.slips, '#f87171');
  if (c3) drawLine(c3, series.labels, series.money, '#22c55e');
}
