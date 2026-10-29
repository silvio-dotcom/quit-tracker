import {
  allChipTiers,
  highestEarnedChip,
  nextChipTarget,
  chipStatuses,
  formatChipRemaining,
  formatChipEarnedDate,
  isAtMaxChip,
} from './chips.js';
import { renderPixelCoin } from './chip-art.js';
import { BASE_SMOKE_FREE_CHIPS } from './constants.js';
import { msSinceQuit } from './stats.js';
import { isChipHealthUnlockTier } from './chip-health-unlocks.js';
import { showChipHealthUnlockModal } from './chip-health-unlock-ui.js';

function $(sel) {
  return document.querySelector(sel);
}

function chipLabelHtml(label, escapeHtml) {
  let s = escapeHtml(label);
  s = s.replace(/DÍAS/g, 'D<span class="ia">I</span>AS');
  s = s.replace(/DÍA/g, 'D<span class="ia">I</span>A');
  if (s.includes('AÑO')) {
    s = s.replace(/AÑO/g, '<span class="px-accent-word">AÑO</span>');
  }
  return s;
}

function displayLabel(state, now) {
  const earned = highestEarnedChip(state, now);
  if (earned) return earned.tier.label;
  const next = nextChipTarget(state, now);
  return next?.tier.label ?? BASE_SMOKE_FREE_CHIPS[0].label;
}

export function heroChipMarkup(state, now = Date.now()) {
  const coinSize = 76;
  if (!state.profile.quitDate) {
    return renderPixelCoin(BASE_SMOKE_FREE_CHIPS[0], { size: coinSize, mode: 'locked', idleSpin: false });
  }
  const earned = highestEarnedChip(state, now);
  if (earned) {
    const max = isAtMaxChip(state, now);
    const coin = renderPixelCoin(earned.tier, { size: coinSize, mode: 'earned', idleSpin: !max });
    const maxBadge = max ? '<span class="hero-chip-max pixel-label">MAX</span>' : '';
    return `${coin}${maxBadge}`;
  }
  const next = nextChipTarget(state, now);
  if (next) {
    return renderPixelCoin(next.tier, { size: coinSize, mode: 'next', progress: next.progress });
  }
  return '';
}

export function renderHeroChip(state, now = Date.now(), popUnlock = false) {
  const mount = $('#hero-chip-mount');
  const btn = $('#hero-chip-btn');
  const labelEl = $('#hero-chip-label');
  const platStage = $('#plat-stage');
  if (!mount && !platStage) return;

  if (!platStage && mount) {
    mount.innerHTML = heroChipMarkup(state, now);
    if (popUnlock) {
      mount.classList.add('coin-pop');
      mount.innerHTML += '<span class="coin-sparkle" aria-hidden="true"></span><span class="coin-sparkle coin-sparkle--b" aria-hidden="true"></span>';
      window.setTimeout(() => mount.classList.remove('coin-pop'), 700);
    }
  } else if (mount) {
    mount.innerHTML = heroChipMarkup(state, now);
  }

  const maxChip = isAtMaxChip(state, now);
  const label = displayLabel(state, now);
  if (labelEl) {
    labelEl.textContent = maxChip ? `${label} · MAX` : label;
    labelEl.classList.remove('hidden');
    labelEl.classList.toggle('hero-chip-label--max', maxChip);
  }

  if (btn) {
    const earned = highestEarnedChip(state, now);
    const next = nextChipTarget(state, now);
    btn.setAttribute(
      'aria-label',
      maxChip
        ? `Mis medallas: ${earned.tier.label}, todas ganadas`
        : earned
          ? `Mis medallas: ${earned.tier.label} ganada`
          : `Próxima medalla: ${next?.tier.shortLabel ?? '24 h'}`
    );
    btn.classList.toggle('hero-chip-btn--max', maxChip);
    btn.classList.remove('chip-animate');
  }

  const hint = $('#hero-chip-hint');
  if (hint) {
    const next = nextChipTarget(state, now);
    const earned = highestEarnedChip(state, now);
    if (maxChip) {
      hint.textContent = 'Completo';
      hint.classList.remove('hidden');
      hint.classList.add('hero-chip-hint--max');
    } else if (!earned && next) {
      hint.textContent = formatChipRemaining(next.remainingMs);
      hint.classList.remove('hidden');
      hint.classList.remove('hero-chip-hint--max');
    } else {
      hint.classList.add('hidden');
      hint.classList.remove('hero-chip-hint--max');
    }
  }
}

export function openChipsSheet() {
  $('#modal-chips')?.classList.add('open');
  document.body.classList.add('modal-open');
}

export function closeChipsSheet() {
  $('#modal-chips')?.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
}

export function renderChipsSheet(state, now = Date.now(), escapeHtml) {
  renderChipsPathGrid('#chips-grid', state, now, escapeHtml);
  const summary = $('#chips-sheet-summary');
  if (summary) {
    const ms = msSinceQuit(state.profile, now);
    const top = highestEarnedChip(state, now);
    if (isAtMaxChip(state, now)) {
      summary.textContent = `Las ${allChipTiers().length} medallas ganadas — MAX en tu primer año.`;
    } else if (top) {
      summary.textContent = `Medalla más alta: ${top.tier.label}`;
    } else if (ms > 0) {
      summary.textContent = 'Tu primera medalla se desbloquea a las 24 horas sin fumar.';
    } else {
      summary.textContent = '';
    }
  }
}

export function renderMedallasLadder(state, now = Date.now(), escapeHtml) {
  renderChipsPathGrid('#medallas-ladder', state, now, escapeHtml);
}

function renderChipsPathGrid(rootSel, state, now, escapeHtml) {
  const root = $(rootSel);
  if (!root) return;
  const rows = chipStatuses(state, now);
  const next = nextChipTarget(state, now);
  root.classList.add('chips-path-grid');
  root.innerHTML = rows
    .map(({ tier, earned, earnedAt, remainingMs }) => {
      const isNext = !earned && next?.tier.id === tier.id;
      const isCastle = tier.id === 'chip-1y';
      const coin = renderPixelCoin(tier, {
        size: 56,
        mode: earned ? 'earned' : isNext ? 'next' : 'locked',
        idleSpin: earned && !isCastle,
        progress: isNext ? next.progress : 0,
      });
      const meta = earned
        ? `<span class="chips-grid-date">${escapeHtml(formatChipEarnedDate(earnedAt))}</span>`
        : `<span class="chips-grid-remaining">${escapeHtml(formatChipRemaining(remainingMs))}</span>`;
      const maxTag =
        tier.id === 'chip-1y' && earned ? '<span class="chips-grid-max pixel-label">MÁX</span>' : '';
      const healthTap = earned && isChipHealthUnlockTier(tier.id);
      const tapAttrs = healthTap
        ? ` data-health-chip="${escapeHtml(tier.id)}" role="button" tabindex="0" aria-label="Dato de salud de ${escapeHtml(tier.label)}"`
        : '';
      const extraClass = isNext ? ' chips-grid-item--next' : isCastle ? ' chips-grid-item--castle' : '';
      const healthClass = healthTap ? ' chips-grid-item--health-tap' : '';
      return `<article class="chips-grid-item ${earned ? 'earned' : 'locked'}${extraClass}${healthClass}"${tapAttrs}>
        <div class="chips-grid-art">${coin}${maxTag}</div>
        <p class="chips-grid-label pixel-label">${chipLabelHtml(tier.label, escapeHtml)}</p>
        ${meta}
      </article>`;
    })
    .join('');
}

function openHealthChipFromGrid(tierId) {
  const tier = BASE_SMOKE_FREE_CHIPS.find((t) => t.id === tierId);
  if (!tier) return;
  showChipHealthUnlockModal(tier, () => {});
}

export function bindChipsUi(getState, escapeHtml) {
  $('#hero-chip-btn')?.addEventListener('click', () => {
    renderChipsSheet(getState(), Date.now(), escapeHtml);
    openChipsSheet();
  });
  $$('[data-close="modal-chips"]').forEach((btn) => {
    btn.addEventListener('click', closeChipsSheet);
  });
  $('#chips-grid')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-health-chip]');
    if (!item) return;
    openHealthChipFromGrid(item.dataset.healthChip);
  });
  $('#chips-grid')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('[data-health-chip]');
    if (!item) return;
    e.preventDefault();
    openHealthChipFromGrid(item.dataset.healthChip);
  });
  $('#medallas-ladder')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-health-chip]');
    if (!item) return;
    openHealthChipFromGrid(item.dataset.healthChip);
  });
  $('#medallas-ladder')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('[data-health-chip]');
    if (!item) return;
    e.preventDefault();
    openHealthChipFromGrid(item.dataset.healthChip);
  });
}

function $$(sel) {
  return [...document.querySelectorAll(sel)];
}
