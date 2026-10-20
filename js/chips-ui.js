import {
  highestEarnedChip,
  nextChipTarget,
  chipStatuses,
  formatChipRemaining,
  formatChipEarnedDate,
} from './chips.js';
import { renderChipSvg } from './chip-art.js';
import { BASE_SMOKE_FREE_CHIPS } from './constants.js';
import { msSinceQuit } from './stats.js';

function $(sel) {
  return document.querySelector(sel);
}

export function heroChipMarkup(state, now = Date.now()) {
  if (!state.profile.quitDate) {
    return renderChipSvg(BASE_SMOKE_FREE_CHIPS[0], { size: 80, mode: 'locked' });
  }
  const earned = highestEarnedChip(state, now);
  if (earned) {
    return renderChipSvg(earned.tier, { size: 80, mode: 'earned' });
  }
  const next = nextChipTarget(state, now);
  if (next) {
    return renderChipSvg(next.tier, { size: 80, mode: 'next', progress: next.progress });
  }
  return '';
}

export function renderHeroChip(state, now = Date.now(), animate = false) {
  const mount = $('#hero-chip-mount');
  const btn = $('#hero-chip-btn');
  if (!mount) return;
  mount.innerHTML = heroChipMarkup(state, now);
  if (btn) {
    const earned = highestEarnedChip(state, now);
    const next = nextChipTarget(state, now);
    btn.setAttribute(
      'aria-label',
      earned ? `My chips: ${earned.tier.label} earned` : `Next chip: ${next?.tier.shortLabel ?? '24h'}`
    );
    btn.classList.toggle('chip-animate', animate);
  }
  const hint = $('#hero-chip-hint');
  if (hint) {
    const next = nextChipTarget(state, now);
    if (!highestEarnedChip(state, now) && next) {
      hint.textContent = `${next.tier.shortLabel} · ${formatChipRemaining(next.remainingMs)}`;
      hint.classList.remove('hidden');
    } else {
      hint.classList.add('hidden');
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
  const root = $('#chips-grid');
  if (!root) return;
  const rows = chipStatuses(state, now);
  root.innerHTML = rows
    .map(({ tier, earned, earnedAt, remainingMs }) => {
      const svg = renderChipSvg(tier, { size: 72, mode: earned ? 'earned' : 'locked' });
      const meta = earned
        ? `<span class="chips-grid-date">${escapeHtml(formatChipEarnedDate(earnedAt))}</span>`
        : `<span class="chips-grid-remaining muted">${escapeHtml(formatChipRemaining(remainingMs))} left</span>`;
      return `<article class="chips-grid-item ${earned ? 'earned' : 'locked'}">
        <div class="chips-grid-art">${svg}</div>
        <p class="chips-grid-label">${escapeHtml(tier.label)}</p>
        ${meta}
      </article>`;
    })
    .join('');
  const summary = $('#chips-sheet-summary');
  if (summary) {
    const ms = msSinceQuit(state.profile, now);
    const top = highestEarnedChip(state, now);
    summary.textContent = top
      ? `Highest chip: ${top.tier.label}`
      : ms > 0
        ? 'Your first chip unlocks at 24 hours smoke-free.'
        : '';
  }
}

export function bindChipsUi(getState, escapeHtml) {
  $('#hero-chip-btn')?.addEventListener('click', () => {
    renderChipsSheet(getState(), Date.now(), escapeHtml);
    openChipsSheet();
  });
  $$('[data-close="modal-chips"]').forEach((btn) => {
    btn.addEventListener('click', closeChipsSheet);
  });
}

function $$(sel) {
  return [...document.querySelectorAll(sel)];
}
