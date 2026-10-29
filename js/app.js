import { CURRENCIES } from './constants.js';
import { loadState, saveState, exportJson, importJson } from './storage.js';
import {
  msSinceQuit,
  cigarettesAvoided,
  moneySaved,
  formatDuration,
  healthProgress,
  formatMoney,
  formatDayCount,
  formatStreakDisplay,
  projectedMoneySaved,
  MONEY_PROJECTION_DAYS,
} from './stats.js';
import { buildNextUpHtml } from './next-up.js';
import { isLongTermHealthMilestone } from './health-milestones.js';
import {
  processMilestoneUnlocks,
  migrateCelebrationsV14,
  migrateChipsV17,
  setMilestoneAlertsEnabled,
  MILESTONE_ALERTS_HELP,
  refreshMilestoneSchedules,
} from './milestone-alerts.js';
import { openSharePreview, bindSharePreviewUi } from './share-ui.js';
import { renderHeroChip, bindChipsUi } from './chips-ui.js';
import { registerPredictiveBack } from './back-handler.js';
import { initNativeShell, onNativeAppActive } from './native-shell.js';
import { syncWidgetSnapshot } from './widget-sync.js';
import { renderBadgesScreen, homeLevelPillHtml, BADGE_FILTER_ALL } from './badges-screen.js';
import { initPixelNavIcons } from './pixel-nav-icons.js';
import { syncAchievementUnlocks, unlockedAchievements } from './achievements.js';
import { toDatetimeLocalValue, datetimeLocalNow, quitDateFromDatetimeLocal } from './datetime.js';
import { initInstallUi, updateInstallUi } from './install.js';
import {
  getCurrentRank,
  getNextRank,
  progressToNextRank,
  rankMetrics,
  rankLadderStatus,
  nextRankHint,
  formatSmokeFreeRequirement,
  RANK_LADDER,
  currentRankIndex,
} from './ranks.js';

let state = loadState();
let tickTimer = null;
let healthExpanded = false;
let badgeFilter = BADGE_FILTER_ALL;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function setWidth(sel, width) {
  const el = $(sel);
  if (el) el.style.width = width;
}

function persist() {
  saveState(state);
  refreshMilestoneSchedules(state).catch(() => {});
}

function showView(name) {
  $$('[data-view]').forEach((el) => el.classList.toggle('hidden', el.dataset.view !== name));
  $$('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === name));
  if (name === 'rank') renderRank();
  if (name === 'badges') renderBadges();
  if (name === 'more') renderMore();
  updateInstallUi();
}

function openModal(id) {
  $(`#${id}`)?.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  $(`#${id}`)?.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
}

function closeTopModal() {
  const open = document.querySelector('.modal.open');
  if (!open) return false;
  open.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
  return true;
}

function getActiveTab() {
  return document.querySelector('.nav-btn.active')?.dataset.nav || 'home';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
window.__QT_TOAST__ = toast;

function needsSetup() {
  return !state.profile.quitDate;
}

function renderSetup() {
  const p = state.profile;
  $('#setup-name').value = p.displayName || 'Silvio';
  $('#setup-quit').value = p.quitDate ? toDatetimeLocalValue(p.quitDate) : datetimeLocalNow();
  $('#setup-cpd').value = p.cigsPerDay;
  $('#setup-cpp').value = p.cigsPerPack;
  $('#setup-price').value = p.packPrice;
  $('#setup-currency').innerHTML = Object.entries(CURRENCIES)
    .map(([k, v]) => `<option value="${k}" ${p.currency === k ? 'selected' : ''}>${k} (${v.symbol})</option>`)
    .join('');
}

function renderHealthHome(now = Date.now()) {
  const items = healthProgress(now, state.profile.quitDate);
  const recent = items.filter((m) => m.done).slice(-3).reverse();

  const recentEl = $('#health-recent-list');
  if (recentEl) {
    recentEl.innerHTML = recent.length
      ? recent
          .map(
            (m) => `<li class="health-recent-item">
          <span class="health-recent-title">✓ ${escapeHtml(m.displayBenefit)}</span>
          <a class="health-source-inline" href="${escapeAttr(m.source.url)}" target="_blank" rel="noopener noreferrer">Fuente: ${escapeHtml(m.source.name)}</a>
        </li>`
          )
          .join('')
      : '<li class="muted">Tus primeros hitos están a minutos de distancia.</li>';
  }

  const full = $('#health-list-home');
  const toggle = $('#btn-health-toggle');
  if (full) {
    full.classList.toggle('hidden', !healthExpanded);
    const nearTerm = items.filter((m) => !isLongTermHealthMilestone(m));
    const longTerm = items.filter((m) => isLongTermHealthMilestone(m));

    const renderNear = (m) => `
      <article class="health-item ${m.done ? 'done' : ''}">
        <div class="health-head">
          <span class="health-title">${escapeHtml(m.displayBenefit)}</span>
          <span class="health-pct">${m.done ? '✓' : `${Math.round(m.progress)}%`}</span>
        </div>
        <p class="health-at muted small">a los ${escapeHtml(m.title)}</p>
        <p class="health-source"><a href="${escapeAttr(m.source.url)}" target="_blank" rel="noopener noreferrer">Fuente: ${escapeHtml(m.source.name)}</a></p>
        <div class="progress-track"><div class="progress-fill" style="width:${m.progress}%"></div></div>
      </article>`;

    const renderLong = (m) => `
      <article class="health-item health-item--longterm ${m.done ? 'done' : ''}">
        <div class="health-head">
          <span class="health-title">${escapeHtml(m.displayBenefit)}</span>
          <span class="health-pct">${m.done ? '✓' : ''}</span>
        </div>
        <p class="health-at muted small">a los ${escapeHtml(m.title)}</p>
        <p class="health-source"><a href="${escapeAttr(m.source.url)}" target="_blank" rel="noopener noreferrer">Fuente: ${escapeHtml(m.source.name)}</a></p>
      </article>`;

    const longBlock = longTerm.length
      ? `<h3 class="health-longterm-heading pixel-label">Largo plazo</h3>${longTerm.map(renderLong).join('')}`
      : '';

    full.innerHTML = `${nearTerm.map(renderNear).join('')}${longBlock}`;
  }
  if (toggle) toggle.textContent = healthExpanded ? 'Ocultar línea de tiempo' : 'Ver todos los hitos de salud';
}

function renderRankPreview(now = Date.now()) {
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const next = getNextRank(metrics);
  const pct = progressToNextRank(metrics);
  setText('#rank-dash-icon', rank.icon);
  setText('#rank-dash-name', rank.name);
  setText('#rank-dash-pct', next ? `${pct}%` : 'MAX');
  setWidth('#rank-dash-bar', `${pct}%`);
  const nextEl = $('#rank-dash-next');
  if (nextEl) {
    nextEl.textContent = next
      ? `Siguiente: ${next.icon} ${next.name} — ${nextRankHint(metrics, next) || 'casi ahí'}`
      : 'Llegaste al rango más alto.';
  }
  const streaks = $('#rank-dash-streaks');
  if (streaks) streaks.textContent = `Racha actual: ${formatStreakDisplay(state, now)}`;
}

function renderDashboard() {
  const now = Date.now();
  if (state.profile.quitDate && !state.celebrationMigrationV14) {
    migrateCelebrationsV14(state, now, persist);
  }
  if (state.profile.quitDate && !state.chipCelebrationMigrationV17) {
    migrateChipsV17(state, now, persist);
  }
  const ms = msSinceQuit(state.profile, now);
  const dur = formatDuration(ms);
  const counter = $('#live-counter');
  if (counter) {
    counter.innerHTML = dur.parts
      .slice(0, 4)
      .map((p) => `<span class="counter-block"><span class="counter-val">${p.v}</span><span class="counter-unit">${p.u}</span></span>`)
      .join('');
  }
  setText('#stat-cigs', cigarettesAvoided(state, now).toLocaleString());
  setText('#stat-money', formatMoney(moneySaved(state, now), state.profile.currency, CURRENCIES));
  const projEl = $('#money-projections');
  if (projEl) {
    projEl.innerHTML = MONEY_PROJECTION_DAYS
      .map(
        ({ label, days }) =>
          `<li>${label}: ${formatMoney(projectedMoneySaved(state, days), state.profile.currency, CURRENCIES)}</li>`
      )
      .join('');
  }
  setText('#stat-streak', formatStreakDisplay(state, now));
  const nextUp = $('#next-up-body');
  if (nextUp) nextUp.innerHTML = buildNextUpHtml(state, now, escapeHtml);
  renderRankPreview(now);
  renderHealthHome(now);
  processMilestoneUnlocks(state, now, toast, persist);
  const chipAnim = Boolean(window.__QT_CHIP_ANIM__);
  if (chipAnim) window.__QT_CHIP_ANIM__ = false;
  renderHeroChip(state, now, chipAnim);
  renderHomeLevel(now);
  checkNewRanks(now);
}

function renderRank() {
  const now = Date.now();
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const next = getNextRank(metrics);
  const pct = progressToNextRank(metrics);
  setText('#rank-hero-icon', rank.icon);
  setText('#rank-hero-name', rank.name);
  setText('#rank-hero-tag', rank.tagline);
  setText('#rank-current-streak', formatStreakDisplay(state, now));
  setWidth('#rank-hero-bar', `${pct}%`);
  setText(
    '#rank-hero-next',
    next
      ? `→ ${next.icon} ${next.name}: ${formatSmokeFreeRequirement(next.smokeFreeMs)}`
      : 'Rango leyenda — un año sin fumar. Lo lograste.'
  );

  const ladder = $('#rank-ladder');
  if (ladder) {
    ladder.innerHTML = rankLadderStatus(metrics)
      .map(({ rank: r, unlocked, current }) => {
        const req = formatSmokeFreeRequirement(r.smokeFreeMs);
        return `<article class="rank-row ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}">
          <span class="rank-row-icon">${unlocked ? r.icon : '🔒'}</span>
          <div class="rank-row-body">
            <span class="rank-row-name">${r.name}${current ? ' · Tú' : ''}</span>
            <span class="rank-row-req muted">${req}</span>
          </div>
        </article>`;
      })
      .join('');
  }
  renderRankPreview(now);
}

function renderBadges() {
  const now = Date.now();
  const levelEl = $('#badge-level-bar');
  const summaryEl = $('#badge-summary');
  const filtersEl = $('#badge-filters');
  const root = $('#badge-sections');
  if (!root) return;

  const view = renderBadgesScreen({
    state,
    now,
    filter: badgeFilter,
    escapeHtml,
    onFilterChange: (id) => {
      badgeFilter = id || BADGE_FILTER_ALL;
      renderBadges();
    },
  });

  if (levelEl) levelEl.innerHTML = view.levelHtml;
  if (summaryEl) summaryEl.textContent = view.summary;
  if (filtersEl) {
    filtersEl.innerHTML = view.filterHtml;
    view.bindFilters(filtersEl);
  }
  root.innerHTML = view.bodyHtml;
}

function renderHomeLevel(now = Date.now()) {
  const el = $('#home-level-pill');
  if (!el || !state.profile.quitDate) {
    if (el) el.innerHTML = '';
    return;
  }
  el.innerHTML = homeLevelPillHtml(state, now, escapeHtml);
}

function renderMore() {
  const p = state.profile;
  const quitInput = $('#settings-quit');
  if (quitInput) quitInput.value = toDatetimeLocalValue(p.quitDate);
  $('#settings-cpd').value = p.cigsPerDay;
  $('#settings-cpp').value = p.cigsPerPack;
  $('#settings-price').value = p.packPrice;
  $('#settings-currency').innerHTML = Object.entries(CURRENCIES)
    .map(([k, v]) => `<option value="${k}" ${p.currency === k ? 'selected' : ''}>${k}</option>`)
    .join('');
  setText('#stats-current', formatStreakDisplay(state));
  const toggle = $('#toggle-milestone-alerts');
  if (toggle) toggle.checked = Boolean(state.milestoneAlertsEnabled);
  setText('#milestone-alerts-help', MILESTONE_ALERTS_HELP);
}

function openSetupWizard() {
  renderSetup();
  openModal('modal-setup');
}

function startOverAfterSmoking() {
  const msg = 'Esto reiniciará tu fecha de dejar de fumar a ahora y empezará un intento nuevo. ¿Continuar?';
  if (!confirm(msg)) return;
  state.profile.quitDate = new Date().toISOString();
  state.seenRanks = ['rookie'];
  persist();
  renderDashboard();
  toast('Nuevo comienzo — tú puedes.');
}

function checkNewRanks(now = Date.now()) {
  const metrics = rankMetrics(state, now);
  const idx = currentRankIndex(metrics);
  const unlockedIds = RANK_LADDER.slice(0, idx + 1).map((r) => r.id);
  if (!state.seenRanks?.length) {
    state.seenRanks = unlockedIds;
    persist();
    return;
  }
  const fresh = unlockedIds.filter((id) => !state.seenRanks.includes(id));
  if (!fresh.length) return;
  state.seenRanks = [...new Set([...state.seenRanks, ...fresh])];
  persist();
  const newest = RANK_LADDER.find((r) => r.id === fresh[fresh.length - 1]);
  if (newest && newest.id !== 'rookie') showRankUp(newest);
}

function showRankUp(rank) {
  setText('#rank-up-icon', rank.icon);
  setText('#rank-up-title', rank.name);
  setText('#rank-up-desc', rank.tagline);
  openModal('modal-rank-up');
}

function bindEvents() {
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.nav));
  });

  $('#rank-dashboard-card')?.addEventListener('click', () => showView('rank'));
  $('#btn-health-toggle')?.addEventListener('click', () => {
    healthExpanded = !healthExpanded;
    renderHealthHome();
  });
  $('#btn-start-over')?.addEventListener('click', startOverAfterSmoking);
  $('#btn-open-setup')?.addEventListener('click', openSetupWizard);
  bindSharePreviewUi(() => state, toast);
  bindChipsUi(() => state, escapeHtml);
  $('#btn-share-progress')?.addEventListener('click', async () => {
    try {
      await openSharePreview(state, toast);
    } catch {
      toast('No se pudo preparar para compartir');
    }
  });
  $('#toggle-milestone-alerts')?.addEventListener('change', async (e) => {
    const perm = await setMilestoneAlertsEnabled(state, e.target.checked, persist);
    if (e.target.checked && perm !== 'granted') {
      e.target.checked = false;
      toast('Notificaciones bloqueadas — actívalas en ajustes del navegador.');
    }
    renderMore();
  });

  $('#setup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.profile.displayName = $('#setup-name').value.trim() || 'Silvio';
    const quit = quitDateFromDatetimeLocal($('#setup-quit').value);
    if (!quit.ok) {
      toast(quit.error);
      return;
    }
    state.profile.quitDate = quit.iso;
    state.profile.cigsPerDay = Number($('#setup-cpd').value) || 15;
    state.profile.cigsPerPack = Number($('#setup-cpp').value) || 20;
    state.profile.packPrice = Number($('#setup-price').value) || 0;
    state.profile.currency = $('#setup-currency').value;
    persist();
    closeModal('modal-setup');
    renderDashboard();
    toast(`¡Vamos, ${state.profile.displayName}!`);
  });

  $('#settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#settings-quit').value;
    if (q) {
      const quit = quitDateFromDatetimeLocal(q);
      if (!quit.ok) {
        toast(quit.error);
        return;
      }
      state.profile.quitDate = quit.iso;
    }
    state.profile.cigsPerDay = Number($('#settings-cpd').value);
    state.profile.cigsPerPack = Number($('#settings-cpp').value);
    state.profile.packPrice = Number($('#settings-price').value);
    state.profile.currency = $('#settings-currency').value;
    persist();
    renderDashboard();
    toast('Ajustes guardados');
  });

  $('#btn-export')?.addEventListener('click', () => exportJson(state));
  $('#import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      state = await importJson(file);
      renderAll();
      toast('Copia de seguridad importada');
    } catch {
      toast('No se pudo importar el archivo');
    }
    e.target.value = '';
  });

  $$('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  $('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.closest('.modal')?.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  });
}

/** One-time: avoid toast storm for badges already earned before v9. */
function migrateBadgeNotificationsV9(now = Date.now()) {
  if (state.badgeMigrationV9) return;
  syncAchievementUnlocks(state, now);
  const unlockedIds = unlockedAchievements(state, now).map((a) => a.id);
  state.seenAchievements = [...new Set([...(state.seenAchievements || []), ...unlockedIds])];
  state.badgeMigrationV9 = true;
  state.version = 3;
  persist();
}

function renderAll() {
  renderDashboard();
  if (needsSetup()) {
    renderSetup();
    openModal('modal-setup');
  }
}

function startTicker() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (document.visibilityState === 'visible') renderDashboard();
  }, 1000);
}

export function initApp() {
  initPixelNavIcons();
  bindEvents();
  initInstallUi();
  initNativeShell().then(() => updateInstallUi());
  registerPredictiveBack({
    closeTopModal,
    getActiveTab,
    goHome: () => showView('home'),
    exitApp: () => window.Capacitor?.Plugins?.App?.exitApp?.(),
  });
  onNativeAppActive(() => {
    refreshMilestoneSchedules(state).catch(() => {});
    syncWidgetSnapshot(state).catch(() => {});
  });
  migrateBadgeNotificationsV9();
  const now = Date.now();
  migrateCelebrationsV14(state, now, persist);
  migrateChipsV17(state, now, persist);
  renderAll();
  refreshMilestoneSchedules(state).catch(() => {});
  syncWidgetSnapshot(state, now).catch(() => {});
  startTicker();
  showView('home');
  window.__QT_APP_READY__ = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
