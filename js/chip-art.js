/**
 * Premium round smoke-free chip / medallion (SVG).
 * @param {import('./constants.js').BASE_SMOKE_FREE_CHIPS[0]} tier
 * @param {{ size?: number, mode?: 'earned'|'next'|'locked', progress?: number }} opts
 */
export function renderChipSvg(tier, opts = {}) {
  const size = opts.size ?? 80;
  const mode = opts.mode ?? 'earned';
  const progress = Math.min(100, Math.max(0, opts.progress ?? 0));
  const dim = mode === 'locked' || mode === 'next';
  const id = `chip-${tier.id}-${size}`;
  const { inner, rim, text } = tier.palette;
  const ring = 2 * Math.PI * 34;
  const dash = (progress / 100) * ring;

  const opacity = dim ? 0.45 : 1;
  const strokeOuter = mode === 'next' ? 'rgba(148,163,184,0.55)' : rim;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="${size}" height="${size}" class="chip-svg" aria-hidden="true">
  <defs>
    <radialGradient id="${id}-g" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${inner[0]}"/>
      <stop offset="100%" stop-color="${inner[1]}"/>
    </radialGradient>
    <linearGradient id="${id}-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rim}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${inner[1]}"/>
    </linearGradient>
  </defs>
  ${mode === 'next' ? `<circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
  <circle cx="40" cy="40" r="36" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round"
    stroke-dasharray="${dash} ${ring}" transform="rotate(-90 40 40)"/>` : ''}
  <circle cx="40" cy="40" r="34" fill="url(#${id}-rim)" opacity="${opacity}"/>
  <circle cx="40" cy="40" r="28" fill="url(#${id}-g)" opacity="${opacity}" stroke="${strokeOuter}" stroke-width="2"/>
  <circle cx="40" cy="40" r="26" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
  <text x="40" y="38" text-anchor="middle" fill="${text}" font-family="system-ui,sans-serif" font-size="9" font-weight="800" opacity="${opacity}">${tier.label}</text>
  <text x="40" y="48" text-anchor="middle" fill="${text}" font-family="system-ui,sans-serif" font-size="5.5" font-weight="600" letter-spacing="1.2" opacity="${opacity * 0.85}">SMOKE FREE</text>
  ${tier.kind === 'medallion' ? `<circle cx="40" cy="40" r="22" fill="none" stroke="${rim}" stroke-width="1" opacity="${opacity * 0.5}"/>` : ''}
</svg>`;
}

export async function drawChipOnCanvas(ctx, tier, x, y, size = 96) {
  const svg = renderChipSvg(tier, { size: 80, mode: 'earned' });
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  ctx.drawImage(img, x, y, size, size);
}
