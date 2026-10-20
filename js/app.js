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
} from './stats.js';
import {
  BADGE_CATEGORIES,
  badgeStatuses,
  sortBadgesForDisplay,
  syncAchievementUnlocks,
  unlockedAchievements,
  formatUnlockDate,
  moneyBadgeTitle,
} from './achievements.js';
import { toDatetimeLocalValue, datetimeLocalNow, quitDateFromDatetimeLocal } from './datetime.js';
import {
  getCurrentRank,
  getNextRank,
  progressToNextRank,
  rankMetrics,
  rankLadderStatus,
  leaderboardPayload,
  nextRankHint,
  formatSmokeFreeRequirement,
  RANK_LADDER,
  currentRankIndex,
} from './ranks.js';

let state = loadState();
let tickTimer = null;
let healthExpanded = false;

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
}

function showView(name) {
  $$('[data-view]').forEach((el) => el.classList.toggle('hidden', el.dataset.view !== name));
  $$('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === name));
  if (name === 'rank') renderRank();
  if (name === 'badges') renderBadges();
  if (name === 'more') renderMore();
}

function openModal(id) {
  $(`#${id}`)?.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  $(`#${id}`)?.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
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
  const next = items.find((m) => !m.done);
  const recent = items.filter((m) => m.done).slice(-3).reverse();

  const nextEl = $('#health-next-card');
  if (nextEl) {
    if (!state.profile.quitDate) {
      nextEl.innerHTML = '<p class="muted">Complete setup to track health recovery.</p>';
    } else if (next) {
      nextEl.innerHTML = `
        <div class="health-head">
          <span class="health-title">Next: ${escapeHtml(next.title)}</span>
          <span class="health-pct">${Math.round(next.progress)}%</span>
        </div>
        <p class="health-body">${escapeHtml(next.benefit)}</p>
        <p class="health-source"><a href="${escapeAttr(next.source.url)}" target="_blank" rel="noopener noreferrer">Source: ${escapeHtml(next.source.name)}</a></p>
        <div class="progress-track lg"><div class="progress-fill" style="width:${next.progress}%"></div></div>`;
    } else {
      nextEl.innerHTML = '<p class="muted">All listed milestones reached — incredible.</p>';
    }
  }

  const recentEl = $('#health-recent-list');
  if (recentEl) {
    recentEl.innerHTML = recent.length
      ? recent
          .map(
            (m) => `<li class="health-recent-item">
          <span class="health-recent-title">✓ ${escapeHtml(m.title)}</span>
          <a class="health-source-inline" href="${escapeAttr(m.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(m.source.name)}</a>
        </li>`
          )
          .join('')
      : '<li class="muted">Your first milestones are minutes away.</li>';
  }

  const full = $('#health-list-home');
  const toggle = $('#btn-health-toggle');
  if (full) {
    full.classList.toggle('hidden', !healthExpanded);
    full.innerHTML = items
      .map(
        (m) => `
      <article class="health-item ${m.done ? 'done' : ''}">
        <div class="health-head">
          <span class="health-title">${escapeHtml(m.title)}</span>
          <span class="health-pct">${m.done ? '✓' : `${Math.round(m.progress)}%`}</span>
        </div>
        <p class="health-body">${escapeHtml(m.benefit)}</p>
        <p class="health-source"><a href="${escapeAttr(m.source.url)}" target="_blank" rel="noopener noreferrer">Source: ${escapeHtml(m.source.name)}</a></p>
        <div class="progress-track"><div class="progress-fill" style="width:${m.progress}%"></div></div>
      </article>`
      )
      .join('');
  }
  if (toggle) toggle.textContent = healthExpanded ? 'Hide full timeline' : 'See all health milestones';
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
      ? `Next: ${next.icon} ${next.name} — ${nextRankHint(metrics, next) || 'almost there'}`
      : 'You reached the top rank.';
  }
  const streaks = $('#rank-dash-streaks');
  if (streaks) streaks.textContent = `Current streak: ${formatStreakDisplay(state, now)}`;
}

function renderDashboard() {
  const now = Date.now();
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
  setText('#stat-streak', formatStreakDisplay(state, now));
  renderRankPreview(now);
  renderHealthHome(now);
  checkNewAchievements(now);
  checkNewRanks(now);
}

function renderRank() {
  const now = Date.now();
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const next = getNextRank(metrics);
  const pct = progressToNextRank(metrics);
  const payload = leaderboardPayload(state, now);

  setText('#rank-hero-icon', rank.icon);
  setText('#rank-hero-name', rank.name);
  setText('#rank-hero-tag', rank.tagline);
  setText('#rank-current-streak', formatStreakDisplay(state, now));
  setWidth('#rank-hero-bar', `${pct}%`);
  setText('#rank-hero-next', next ? `→ ${next.icon} ${next.name}: ${formatSmokeFreeRequirement(next.smokeFreeMs)}` : 'Top rank unlocked.');
  setText('#rank-hero-score', `Leaderboard score (local): ${payload.score}`);

  const ladder = $('#rank-ladder');
  if (ladder) {
    ladder.innerHTML = rankLadderStatus(metrics)
      .map(({ rank: r, unlocked, current }) => {
        const req = formatSmokeFreeRequirement(r.smokeFreeMs);
        return `<article class="rank-row ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}">
          <span class="rank-row-icon">${unlocked ? r.icon : '🔒'}</span>
          <div class="rank-row-body">
            <span class="rank-row-name">${r.name}${current ? ' · You' : ''}</span>
            <span class="rank-row-req muted">${req}</span>
          </div>
        </article>`;
      })
      .join('');
  }
  renderRankPreview(now);
}

function displayBadgeTitle(achievement) {
  if (achievement.category === 'money') return moneyBadgeTitle(achievement, state.profile.currency);
  return achievement.title;
}

function renderBadges() {
  const now = Date.now();
  syncAchievementUnlocks(state, now);
  const statuses = badgeStatuses(state, now);
  const unlockedTotal = statuses.filter((s) => s.unlocked).length;
  setText('#badge-summary', `${unlockedTotal} of ${statuses.length} badges unlocked`);

  const root = $('#badge-sections');
  if (!root) return;

  root.innerHTML = BADGE_CATEGORIES
    .map((cat) => {
      const inCat = statuses.filter((s) => s.achievement.category === cat.id);
      const sorted = sortBadgesForDisplay(inCat);
      const unlockedInCat = inCat.filter((s) => s.unlocked).length;
      const cards = sorted
        .map((s) => {
          const a = s.achievement;
          const title = escapeHtml(displayBadgeTitle(a));
          const desc = escapeHtml(a.desc);
          const icon = s.unlocked ? a.icon : '🔒';
          const progressBar = !s.unlocked
            ? `<div class="badge-progress-track"><div class="badge-progress-fill" style="width:${s.progress.pct}%"></div></div>
               <p class="badge-progress-label muted">${escapeHtml(s.progressLabel)}</p>`
            : '';
          const unlockedOn = s.unlocked && s.unlockAt
            ? `<p class="badge-unlocked-date muted">Unlocked ${escapeHtml(formatUnlockDate(s.unlockAt))}</p>`
            : s.unlocked
              ? '<p class="badge-unlocked-date muted">Unlocked</p>'
              : '';
          return `<article class="badge ${s.unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon" aria-hidden="true">${icon}</div>
            <div class="badge-title">${title}</div>
            <div class="badge-desc">${desc}</div>
            ${progressBar}
            ${unlockedOn}
          </article>`;
        })
        .join('');
      return `<section class="badge-category" aria-labelledby="badge-cat-${cat.id}">
        <div class="badge-category-head">
          <h3 id="badge-cat-${cat.id}" class="badge-category-title">${cat.emoji} ${escapeHtml(cat.label)}</h3>
          <span class="badge-category-count muted">${unlockedInCat} of ${inCat.length}</span>
        </div>
        <div class="badge-grid">${cards}</div>
      </section>`;
    })
    .join('');
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
}

function openSetupWizard() {
  renderSetup();
  openModal('modal-setup');
}

function startOverAfterSmoking() {
  const msg = 'This will reset your quit date to right now and start a fresh attempt. Continue?';
  if (!confirm(msg)) return;
  state.profile.quitDate = new Date().toISOString();
  state.seenRanks = ['rookie'];
  persist();
  renderDashboard();
  toast('Fresh start — you can do this.');
}

function checkNewAchievements(now) {
  syncAchievementUnlocks(state, now);
  const unlocked = unlockedAchievements(state, now);
  const ids = unlocked.map((a) => a.id);
  const fresh = ids.filter((id) => !(state.seenAchievements || []).includes(id));
  if (!fresh.length) return;
  state.seenAchievements = [...new Set([...(state.seenAchievements || []), ...fresh])];
  persist();
  const a = unlocked.find((x) => x.id === fresh[fresh.length - 1]);
  if (a) toast(`${a.icon} Badge unlocked: ${displayBadgeTitle(a)}`);
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
    toast(`Let's go, ${state.profile.displayName}!`);
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
    toast('Settings saved');
  });

  $('#btn-export')?.addEventListener('click', () => exportJson(state));
  $('#import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      state = await importJson(file);
      renderAll();
      toast('Backup imported');
    } catch {
      toast('Could not import file');
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
  bindEvents();
  migrateBadgeNotificationsV9();
  renderAll();
  startTicker();
  showView('home');
  window.__QT_APP_READY__ = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
