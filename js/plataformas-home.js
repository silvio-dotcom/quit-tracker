import { CURRENCIES } from './constants.js';
import {
  cigarettesAvoided,
  moneySaved,
  formatMoney,
  msSinceQuit,
  currentStreakDays,
} from './stats.js';
import { chipStatuses, highestEarnedChip, nextChipTarget, isAtMaxChip, formatChipRemaining } from './chips.js';
import { allChipTiers } from './chips.js';
import { getCurrentRank, getNextRank, rankMetrics, formatSmokeFreeRequirement } from './ranks.js';
import { xpLevelProgress } from './xp.js';
import { getNextHealthMilestone, formatCountdown } from './next-up.js';
import { healthProgress } from './stats.js';
import { htmlPixelDias, htmlPixelifyWord, padDaysHud } from './plataformas-text.js';
import { renderPixelCoin } from './chip-art.js';

const MS_D = 24 * 60 * 60 * 1000;
const PATH_BLOCKS = 14;

function $(sel) {
  return document.querySelector(sel);
}

function setHtml(sel, html) {
  const el = $(sel);
  if (el) el.innerHTML = html;
}

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

/** Progress 0–100 between previous chip tier and next target. */
export function chipIntervalProgress(state, now = Date.now()) {
  if (!state.profile.quitDate) return { pct: 0, next: null, prevMs: 0 };
  const quit = new Date(state.profile.quitDate).getTime();
  const elapsed = now - quit;
  const next = nextChipTarget(state, now);
  if (!next) return { pct: 100, next: null, prevMs: elapsed };
  const earned = highestEarnedChip(state, now);
  const prevMs = earned ? earned.tier.ms : 0;
  const span = next.tier.ms - prevMs;
  const into = elapsed - prevMs;
  const pct = span > 0 ? Math.min(100, Math.max(0, (into / span) * 100)) : 0;
  return { pct, next, prevMs, remainingMs: next.remainingMs };
}

export function renderChipPathBlocks(state, now = Date.now()) {
  const root = $('#plat-chip-path-blocks');
  if (!root) return;
  if (!state.profile.quitDate) {
    root.innerHTML = '';
    return;
  }
  const { pct, next } = chipIntervalProgress(state, now);
  const filled = Math.round((pct / 100) * PATH_BLOCKS);
  const blocks = [];
  for (let i = 0; i < PATH_BLOCKS; i += 1) {
    blocks.push(i < filled ? '<i class="used" aria-hidden="true"></i>' : '<i class="q" aria-hidden="true">?</i>');
  }
  root.innerHTML = blocks.join('');
  const headTarget = $('#plat-path-target');
  const headEta = $('#plat-path-eta');
  if (isAtMaxChip(state, now)) {
    if (headTarget) headTarget.innerHTML = htmlPixelifyWord('MÁX');
    if (headEta) headEta.textContent = 'Nivel completo';
  } else if (next) {
    if (headTarget) headTarget.textContent = next.tier.label;
    if (headEta) headEta.textContent = `Faltan ${formatCountdown(next.remainingMs)} · ${Math.round(pct)}%`;
  }
}

export function renderPlataformasStage(state, now = Date.now()) {
  const stage = $('#plat-stage');
  if (!stage || !state.profile.quitDate) return;
  const earned = highestEarnedChip(state, now);
  const next = nextChipTarget(state, now);
  const coinSize = 49;
  let blocks = '';
  if (earned && next) {
    blocks = `<div class="qb u" aria-hidden="true"></div>
      <div class="qb u plat-stage-coin-wrap" style="position:relative">
        <div class="pop">${renderPixelCoin(earned.tier, { size: coinSize, mode: 'earned', idleSpin: false })}</div>
      </div>
      <div class="qb" aria-hidden="true">?</div>`;
  } else if (earned && isAtMaxChip(state, now)) {
    blocks = `<div class="qb u" aria-hidden="true"></div>
      <div class="qb u plat-stage-coin-wrap" style="position:relative">
        <div class="pop">${renderPixelCoin(earned.tier, { size: coinSize, mode: 'earned', idleSpin: false })}</div>
      </div>
      <div class="qb plat-castle" aria-hidden="true">★</div>`;
  } else if (next) {
    blocks = `<div class="qb u" aria-hidden="true"></div>
      <div class="qb plat-stage-coin-wrap" style="position:relative">
        <div class="pop">${renderPixelCoin(next.tier, { size: coinSize, mode: 'next', progress: next.progress })}</div>
      </div>
      <div class="qb" aria-hidden="true">?</div>`;
  }
  stage.innerHTML = blocks;
  const tag = $('#plat-medal-tag');
  if (tag) {
    if (earned) {
      const name = earned.tier.notifyLabel.replace(/^medalla de /i, '');
      tag.innerHTML = `Medalla: <b>${name}</b>`;
    } else {
      tag.innerHTML = 'Medalla: <b>24 horas</b>';
    }
  }
}

export function renderPlataformasHealthSign(state, now = Date.now()) {
  const k = $('#plat-health-kicker');
  const p = $('#plat-health-body');
  if (!k || !p || !state.profile.quitDate) return;
  const items = healthProgress(now, state.profile.quitDate);
  const recentDone = [...items].reverse().find((m) => m.done);
  const next = getNextHealthMilestone(state, now);
  if (recentDone) {
    k.textContent = `¡1-UP! SALUD ${recentDone.title}`.toUpperCase();
    p.textContent = recentDone.displayBenefit;
  } else if (next) {
    k.textContent = `¡1-UP! SALUD ${next.title}`.toUpperCase();
    p.textContent = next.displayBenefit;
  } else {
    k.textContent = '¡1-UP! SALUD';
    p.textContent = 'Sigue sin fumar — cada minuto cuenta.';
  }
}

export function renderPlataformasPipeRank(state, now = Date.now()) {
  const el = $('#plat-pipe-rank');
  if (!el) return;
  const metrics = rankMetrics(state, now);
  const next = getNextRank(metrics);
  if (!next) {
    el.innerHTML = `<div class="pipe" aria-hidden="true"><div class="top"></div><div class="body"></div></div>
      <div class="txt">Rango máximo alcanzado — ${htmlPixelifyWord('leyenda')}</div>`;
    return;
  }
  const req = formatSmokeFreeRequirement(next.smokeFreeMs);
  el.innerHTML = `<div class="pipe" aria-hidden="true"><div class="top"></div><div class="body"></div></div>
    <div class="txt">Siguiente rango:<br><b>${htmlPixelifyWord(next.name.toUpperCase())}</b> ${req}</div>`;
}

export function renderPlataformasHud(state, now = Date.now()) {
  if (!state.profile.quitDate) return;
  const days = currentStreakDays(state, now);
  const earnedCount = chipStatuses(state, now).filter((s) => s.earned).length;
  const totalChips = allChipTiers().length;
  const xp = xpLevelProgress(state, now);
  setText('#plat-hud-days', padDaysHud(days));
  setText('#plat-hud-coins', `${earnedCount}/${totalChips}`);
  setText('#plat-hud-money', formatMoney(moneySaved(state, now), state.profile.currency, CURRENCIES));
  setText('#plat-hud-level', String(xp.level));
  const diasLabel = $('#plat-hud-dias-label');
  if (diasLabel) diasLabel.innerHTML = htmlPixelDias();
  const heroDias = $('#plat-hero-dias');
  if (heroDias) heroDias.innerHTML = htmlPixelDias();
}

export function renderPlataformasHeroCounter(state, now = Date.now()) {
  const n = $('#plat-hero-days');
  const sub = $('#plat-hero-sub');
  if (!n || !state.profile.quitDate) return;
  const ms = msSinceQuit(state.profile, now);
  const days = Math.floor(ms / MS_D);
  n.textContent = String(days);
  const remMs = ms % MS_D;
  const h = Math.floor(remMs / (60 * 60 * 1000));
  const m = Math.floor((remMs % (60 * 60 * 1000)) / (60 * 1000));
  const xp = xpLevelProgress(state, now);
  const title = xp.title.charAt(0) + xp.title.slice(1).toLowerCase();
  if (sub) sub.textContent = `+${h} h ${m} min · ${title}`;
}

export function renderPlataformasBrickStats(state, now = Date.now()) {
  setText('#plat-stat-cigs', cigarettesAvoided(state, now).toLocaleString());
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const rankEl = $('#plat-stat-rank');
  if (rankEl) rankEl.textContent = rank.name;
}

export function renderPlataformasHome(state, now = Date.now()) {
  renderPlataformasHud(state, now);
  renderPlataformasHeroCounter(state, now);
  renderPlataformasStage(state, now);
  renderChipPathBlocks(state, now);
  renderPlataformasBrickStats(state, now);
  renderPlataformasHealthSign(state, now);
  renderPlataformasPipeRank(state, now);
}
