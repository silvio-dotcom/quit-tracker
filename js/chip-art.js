/**
 * Original 8-bit pixel-art smoke-free coins (Mario-inspired style, not Nintendo assets).
 */

const OUTLINE = '#1a1228';

function parseHex(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[c(r), c(g), c(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Darken + desaturate while keeping tier hue (locked state). */
function lockedTint(hex, amount = 0.55) {
  const { r, g, b } = parseHex(hex);
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  const grey = lum * 0.35;
  return toHex({
    r: r * (1 - amount) + grey * amount,
    g: g * (1 - amount) + grey * amount,
    b: b * (1 - amount) + grey * amount,
  });
}

/** @param {import('./constants.js').BASE_SMOKE_FREE_CHIPS[0]} tier */
function tierColors(tier, mode) {
  const { inner, rim } = tier.palette;
  if (mode === 'locked') {
    return {
      outline: '#121018',
      light: lockedTint(inner[0], 0.45),
      mid: lockedTint(inner[1], 0.58),
      dark: lockedTint(rim, 0.65),
      slot: lockedTint(rim, 0.72),
      locked: true,
    };
  }
  return { outline: OUTLINE, light: inner[0], mid: inner[1], dark: rim, slot: rim, locked: false };
}

/** Tiny pixel lock (bottom-right of coin grid). */
const LOCK_OFFSETS = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
  [1, 3],
];

function insideEllipse(x, y, w, h) {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = w / 2 - 0.05;
  const ry = h / 2 - 0.05;
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1;
}

function isOutline(x, y, w, h) {
  if (!insideEllipse(x, y, w, h)) return false;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
    if (!insideEllipse(x + dx, y + dy, w, h)) return true;
  }
  return false;
}

function isSlot(x, y, w, h) {
  const cx = Math.floor(w / 2);
  return (x === cx || x === cx - 1) && y >= Math.floor(h * 0.22) && y <= Math.floor(h * 0.78) && insideEllipse(x, y, w, h);
}

function fillForPixel(x, y, w, colors) {
  const t = x / (w - 1);
  if (t < 0.32) return colors.light;
  if (t > 0.68) return colors.dark;
  return colors.mid;
}

const STAR_PIXELS = [
  [8, 3],
  [7, 4], [8, 4], [9, 4],
  [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
  [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6],
  [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
  [7, 8], [8, 8], [9, 8],
  [7, 9], [8, 9],
  [8, 10],
];

function starSet(w) {
  const offX = Math.floor((w - 18) / 2);
  const offY = Math.floor((w - 18) / 2);
  const set = new Set();
  for (const [sx, sy] of STAR_PIXELS) {
    set.add(`${sx + offX},${sy + offY}`);
  }
  return set;
}

function buildCoinPixels(w, h, tier, mode) {
  const colors = tierColors(tier, mode);
  const grid = new Map();
  const star = tier.kind === 'medallion' ? starSet(w) : null;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!insideEllipse(x, y, w, h)) continue;
      let fill;
      if (isOutline(x, y, w, h)) {
        fill = colors.outline;
      } else if (star?.has(`${x},${y}`)) {
        fill = colors.light;
      } else if (tier.kind !== 'medallion' && isSlot(x, y, w, h)) {
        fill = colors.slot;
      } else {
        fill = fillForPixel(x, y, w, colors);
      }
      grid.set(`${x},${y}`, fill);
    }
  }

  if (colors.locked) {
    const lx = w - 5;
    const ly = h - 5;
    const lockFill = '#e2e8f0';
    for (const [dx, dy] of LOCK_OFFSETS) {
      const px = lx + dx;
      const py = ly + dy;
      if (insideEllipse(px, py, w, h)) grid.set(`${px},${py}`, lockFill);
    }
  }

  return [...grid.entries()]
    .map(([key, fill]) => {
      const [x, y] = key.split(',').map(Number);
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    })
    .join('');
}

/**
 * @param {import('./constants.js').BASE_SMOKE_FREE_CHIPS[0]} tier
 * @param {{ size?: number, mode?: 'earned'|'next'|'locked', progress?: number, idleSpin?: boolean }} opts
 */
export function renderPixelCoin(tier, opts = {}) {
  const size = opts.size ?? 80;
  const mode = opts.mode ?? 'earned';
  const progress = Math.min(100, Math.max(0, opts.progress ?? 0));
  const idleSpin = opts.idleSpin !== false && mode !== 'locked';
  const isMedallion = tier.kind === 'medallion';
  const gw = isMedallion ? 18 : 14;
  const gh = isMedallion ? 18 : 16;
  const displayW = Math.round(size * (gw / gh));
  const pixels = buildCoinPixels(gw, gh, tier, mode === 'next' ? 'earned' : mode);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gw} ${gh}" width="${displayW}" height="${size}" class="pixel-coin-svg" shape-rendering="crispEdges" aria-hidden="true">${pixels}</svg>`;

  const spinClass = idleSpin ? 'pixel-coin-spin' : '';
  const frameClass = [
    'pixel-coin-frame',
    mode === 'next' ? 'pixel-coin-frame--next' : '',
    mode === 'locked' ? 'pixel-coin-frame--locked' : '',
    isMedallion ? 'pixel-coin-frame--star' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ring =
    mode === 'next'
      ? `<svg class="pixel-coin-progress" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      <circle cx="18" cy="18" r="16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"
        stroke-dasharray="${(progress / 100) * 100.5} 100.5" transform="rotate(-90 18 18)"/>
    </svg>`
      : '';

  return `<div class="${frameClass}" style="--coin-h:${size}px">${ring}<div class="${spinClass}">${svg}</div></div>`;
}

/** @deprecated name kept for callers */
export function renderChipSvg(tier, opts = {}) {
  return renderPixelCoin(tier, opts);
}

export async function drawChipOnCanvas(ctx, tier, x, y, size = 96) {
  const isMedallion = tier.kind === 'medallion';
  const gh = isMedallion ? 18 : 16;
  const gw = isMedallion ? 18 : 14;
  const html = renderPixelCoin(tier, { size: gh * 4, mode: 'earned', idleSpin: false });
  const svgMatch = html.match(/<svg[\s\S]*<\/svg>/);
  if (!svgMatch) return;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMatch[0])}`;
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  const drawW = size * (gw / gh);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, drawW, size);
}
