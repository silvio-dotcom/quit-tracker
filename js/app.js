import { CURRENCIES, CRAVING_TRIGGERS, ACHIEVEMENTS, defaultState } from './constants.js';
import { loadState, saveState, exportJson, importJson, uid } from './storage.js';
import {
  msSinceQuit,
  cigarettesAvoided,
  moneySaved,
  lifeRegainedMinutes,
  formatDuration,
  currentStreakDays,
  longestStreakDays,
  healthProgress,
  unlockedAchievements,
  dailySeries,
  formatMoney,
  cravingsResistedCount,
} from './stats.js';
import { renderCharts } from './charts.js';
import { createBreathingSession } from './breathing.js';
import {
  getCurrentRank,
  getNextRank,
  progressToNextRank,
  rankMetrics,
  rankLadderStatus,
  leaderboardPayload,
  nextRankHints,
  formatRankRequirement,
  currentRankIndex,
} from './ranks.js';

export function getBasePath() {
  const p = location.pathname;
  if (p.includes('/quit-tracker')) return '/quit-tracker/';
  return './';
}

let state = loadState();
let tickTimer = null;
let breathing = null;
let pendingCraving = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function persist() {
  saveState(state);
}

function showView(name) {
  $$('[data-view]').forEach((el) => el.classList.toggle('hidden', el.dataset.view !== name));
  $$('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === name));
  if (name === 'charts') refreshCharts();
  if (name === 'rank') renderRank();
  if (name === 'health') renderHealth();
  if (name === 'badges') renderBadges();
  if (name === 'log') renderLog();
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

function renderSetup() {
  const p = state.profile;
  $('#setup-name').value = p.displayName || 'Silvio';
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $('#setup-quit').value = p.quitDate
    ? new Date(p.quitDate).toISOString().slice(0, 16)
    : now.toISOString().slice(0, 16);
  $('#setup-cpd').value = p.cigsPerDay;
  $('#setup-cpp').value = p.cigsPerPack;
  $('#setup-price').value = p.packPrice;
  $('#setup-currency').innerHTML = Object.entries(CURRENCIES)
    .map(([k, v]) => `<option value="${k}" ${p.currency === k ? 'selected' : ''}>${k} (${v.symbol})</option>`)
    .join('');
}

function needsSetup() {
  return !state.profile.quitDate;
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
  $('#stat-cigs').textContent = cigarettesAvoided(state, now).toLocaleString();
  $('#stat-money').textContent = formatMoney(moneySaved(state, now), state.profile.currency, CURRENCIES);
  const lifeMin = lifeRegainedMinutes(state, now);
  const lifeH = Math.floor(lifeMin / 60);
  const lifeD = Math.floor(lifeH / 24);
  $('#stat-life').textContent = lifeD > 0 ? `${lifeD}d ${lifeH % 24}h` : `${lifeH}h ${lifeMin % 60}m`;
  $('#stat-streak').textContent = `${currentStreakDays(state, now)} days`;

  const next = healthProgress(now, state.profile.quitDate).find((m) => !m.done);
  const nextEl = $('#next-health');
  if (nextEl) {
    if (next) {
      nextEl.textContent = `Next: ${next.title} — ${Math.round(next.progress)}%`;
    } else if (state.profile.quitDate) {
      nextEl.textContent = 'All listed milestones reached — incredible.';
    } else {
      nextEl.textContent = 'Complete setup to see health recovery.';
    }
  }

  renderReasonsPreview();
  renderGoalPreview();
  syncPersonalBest(now);
  renderRankPreview(now);
  checkNewAchievements(now);
  checkNewRanks(now);
}

function syncPersonalBest(now = Date.now()) {
  const metrics = rankMetrics(state, now);
  const best = Math.max(state.personalBestStreak || 0, metrics.bestStreakDays);
  if (best !== state.personalBestStreak) {
    state.personalBestStreak = best;
    persist();
  }
}

function renderRankPreview(now = Date.now()) {
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const next = getNextRank(metrics);
  const pct = progressToNextRank(metrics);
  $('#rank-dash-icon')?.textContent = rank.icon;
  $('#rank-dash-name')?.textContent = rank.name;
  $('#rank-dash-pct')?.textContent = next ? `${pct}%` : 'MAX';
  const bar = $('#rank-dash-bar');
  if (bar) bar.style.width = `${pct}%`;
  const nextEl = $('#rank-dash-next');
  if (nextEl) {
    nextEl.textContent = next
      ? `Next: ${next.icon} ${next.name} — ${nextRankHints(metrics, next).join(' · ') || 'almost there'}`
      : 'You reached the top rank — legendary.';
  }
  const streaks = $('#rank-dash-streaks');
  if (streaks) {
    streaks.textContent = `Streak ${metrics.streakDays} days · Personal best ${state.personalBestStreak || metrics.bestStreakDays} days`;
  }
}

function renderRank() {
  const now = Date.now();
  syncPersonalBest(now);
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const next = getNextRank(metrics);
  const pct = progressToNextRank(metrics);
  const payload = leaderboardPayload(state, now);

  $('#rank-hero-icon')?.textContent = rank.icon;
  $('#rank-hero-name')?.textContent = rank.name;
  $('#rank-hero-tag')?.textContent = rank.tagline;
  $('#rank-current-streak')?.textContent = String(metrics.streakDays);
  $('#rank-best-streak')?.textContent = String(state.personalBestStreak || metrics.bestStreakDays);
  $('#rank-hero-bar')?.style.width = `${pct}%`;
  $('#rank-hero-next')?.textContent = next
    ? `→ ${next.icon} ${next.name}: ${nextRankHints(metrics, next).join(' · ')}`
    : 'Top rank unlocked.';
  $('#rank-hero-score')?.textContent = `Leaderboard score (local): ${payload.score}`;

  const ladder = $('#rank-ladder');
  if (ladder) {
    ladder.innerHTML = rankLadderStatus(metrics)
      .map(({ rank: r, unlocked, current }) => {
        const reqs = [
          formatRankRequirement('smokeFreeMs', r.requirements.smokeFreeMs),
          formatRankRequirement('cravingsResisted', r.requirements.cravingsResisted),
          formatRankRequirement('streakDays', r.requirements.streakDays),
        ]
          .filter((x) => x !== 'Start your quit' || r.id !== 'rookie')
          .join(' · ');
        return `<article class="rank-row ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}">
          <span class="rank-row-icon">${unlocked ? r.icon : '🔒'}</span>
          <div class="rank-row-body">
            <span class="rank-row-name">${r.name}${current ? ' · You' : ''}</span>
            <span class="rank-row-req muted">${reqs || 'Starting tier'}</span>
          </div>
        </article>`;
      })
      .join('');
  }
  renderRankPreview(now);
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
  $('#rank-up-icon')?.textContent = rank.icon;
  $('#rank-up-title')?.textContent = rank.name;
  $('#rank-up-desc')?.textContent = rank.tagline;
  openModal('modal-rank-up');
}

function renderReasonsPreview() {
  const el = $('#reasons-preview');
  if (!el) return;
  if (!state.reasons.length) {
    el.innerHTML = '<p class="muted">Add your reasons in More → Reasons.</p>';
    return;
  }
  el.innerHTML = state.reasons
    .slice(0, 3)
    .map((r) => `<div class="reason-chip">${escapeHtml(r.text)}</div>`)
    .join('');
}

function renderGoalPreview() {
  const g = state.savingsGoal;
  const el = $('#goal-preview');
  const bar = $('#goal-bar');
  if (!el || !bar) return;
  const saved = moneySaved(state);
  if (!g.targetAmount || !g.name) {
    el.textContent = 'Set a savings goal in More.';
    bar.style.width = '0%';
    return;
  }
  const pct = Math.min(100, (saved / g.targetAmount) * 100);
  el.textContent = `${g.name}: ${formatMoney(saved, state.profile.currency, CURRENCIES)} / ${formatMoney(g.targetAmount, state.profile.currency, CURRENCIES)}`;
  bar.style.width = `${pct}%`;
}

function renderHealth() {
  const list = $('#health-list');
  if (!list) return;
  const items = healthProgress(Date.now(), state.profile.quitDate);
  list.innerHTML = items
    .map(
      (m) => `
    <article class="health-item ${m.done ? 'done' : ''}">
      <div class="health-head">
        <span class="health-title">${m.title}</span>
        <span class="health-pct">${m.done ? '✓' : `${Math.round(m.progress)}%`}</span>
      </div>
      <p class="health-body">${escapeHtml(m.benefit)}</p>
      <p class="health-source"><a href="${escapeAttr(m.source.url)}" target="_blank" rel="noopener noreferrer">Source: ${escapeHtml(m.source.name)}</a></p>
      <div class="progress-track"><div class="progress-fill" style="width:${m.progress}%"></div></div>
    </article>`
    )
    .join('');
}

function renderBadges() {
  const now = Date.now();
  const unlocked = new Set(unlockedAchievements(state, now).map((a) => a.id));
  const grid = $('#badge-grid');
  if (!grid) return;
  grid.innerHTML = ACHIEVEMENTS
    .map((a) => {
      const on = unlocked.has(a.id);
      return `<div class="badge ${on ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${on ? '🏅' : '🔒'}</div>
        <div class="badge-title">${a.title}</div>
        <div class="badge-desc">${a.desc}</div>
      </div>`;
    })
    .join('');
  $('#badge-summary').textContent = `${unlocked.size} / ${ACHIEVEMENTS.length} unlocked`;
}

function renderLog() {
  const cravings = [...(state.cravings || [])].sort((a, b) => b.at - a.at).slice(0, 50);
  const slips = [...(state.slips || [])].sort((a, b) => b.at - a.at).slice(0, 30);
  $('#craving-log').innerHTML = cravings.length
    ? cravings
        .map(
          (c) => `<li>
        <span class="log-time">${new Date(c.at).toLocaleString()}</span>
        <span class="log-meta">Intensity ${c.intensity}/5 · ${escapeHtml(c.trigger || '—')}</span>
        <span class="log-outcome ${c.resisted ? 'good' : 'warn'}">${c.resisted ? 'Resisted' : 'Gave in'}</span>
        ${c.note ? `<span class="log-note">${escapeHtml(c.note)}</span>` : ''}
      </li>`
        )
        .join('')
    : '<li class="muted">No cravings logged yet.</li>';

  $('#slip-log').innerHTML = slips.length
    ? slips
        .map(
          (s) => `<li>
        <span class="log-time">${new Date(s.at).toLocaleString()}</span>
        <span class="log-meta">${s.count} cigarette${s.count > 1 ? 's' : ''}</span>
        ${s.note ? `<span class="log-note">${escapeHtml(s.note)}</span>` : ''}
      </li>`
        )
        .join('')
    : '<li class="muted">No slips logged — keep going.</li>';
}

function renderMore() {
  const p = state.profile;
  $('#settings-quit').value = p.quitDate ? new Date(p.quitDate).toISOString().slice(0, 16) : '';
  $('#settings-cpd').value = p.cigsPerDay;
  $('#settings-cpp').value = p.cigsPerPack;
  $('#settings-price').value = p.packPrice;
  $('#settings-currency').innerHTML = Object.entries(CURRENCIES)
    .map(([k, v]) => `<option value="${k}" ${p.currency === k ? 'selected' : ''}>${k}</option>`)
    .join('');
  $('#goal-name').value = state.savingsGoal.name || '';
  $('#goal-amount').value = state.savingsGoal.targetAmount || '';
  renderReasonsEditor();
  $('#stats-longest').textContent = `${longestStreakDays(state)} days`;
  $('#stats-resisted').textContent = String(cravingsResistedCount(state));
}

function renderReasonsEditor() {
  const el = $('#reasons-editor');
  if (!el) return;
  el.innerHTML = state.reasons
    .map(
      (r) => `<div class="reason-row">
      <input type="text" value="${escapeAttr(r.text)}" data-reason-id="${r.id}" />
      <button type="button" class="btn ghost small" data-del-reason="${r.id}">×</button>
    </div>`
    )
    .join('');
}

function refreshCharts() {
  const series = dailySeries(state, 14);
  renderCharts(series);
  $('#chart-streak-val').textContent = `${currentStreakDays(state)} / best ${longestStreakDays(state)}`;
}

function checkNewAchievements(now) {
  const unlocked = unlockedAchievements(state, now);
  const ids = unlocked.map((a) => a.id);
  const fresh = ids.filter((id) => !(state.seenAchievements || []).includes(id));
  if (fresh.length) {
    state.seenAchievements = [...new Set([...(state.seenAchievements || []), ...fresh])];
    persist();
    const a = ACHIEVEMENTS.find((x) => x.id === fresh[fresh.length - 1]);
    if (a) toast(`Achievement: ${a.title}`);
  }
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
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

function startCravingFlow() {
  pendingCraving = {
    intensity: 3,
    trigger: CRAVING_TRIGGERS[0],
    note: '',
    resisted: true,
  };
  $('#craving-intensity').value = '3';
  $('#craving-trigger').innerHTML = CRAVING_TRIGGERS.map((t) => `<option>${t}</option>`).join('');
  $('#craving-note').value = '';
  openModal('modal-craving');
}

function startBreathing() {
  openModal('modal-breathing');
  const ring = $('#breath-ring');
  const label = $('#breath-label');
  const sub = $('#breath-sub');
  if (breathing) breathing.stop();
  breathing = createBreathingSession({
    cycles: 3,
    onPhase: (phase) => {
      label.textContent = phase.name;
      sub.textContent = `${phase.seconds}s`;
      ring.classList.remove('inhale', 'hold', 'exhale');
      if (phase.name.includes('in')) ring.classList.add('inhale');
      else if (phase.name.includes('out')) ring.classList.add('exhale');
      else ring.classList.add('hold');
    },
    onTick: (rem, phase) => {
      sub.textContent = `${rem}s`;
    },
    onComplete: () => {
      label.textContent = 'Nice work';
      sub.textContent = 'Craving often fades in a few minutes.';
      ring.classList.remove('inhale', 'hold', 'exhale');
    },
  });
  breathing.start();
}

function finishCraving(resisted) {
  pendingCraving.intensity = Number($('#craving-intensity').value);
  pendingCraving.trigger = $('#craving-trigger').value;
  pendingCraving.note = $('#craving-note').value.trim();
  pendingCraving.resisted = resisted;
  state.cravings.push({
    id: uid(),
    at: Date.now(),
    ...pendingCraving,
  });
  persist();
  closeModal('modal-craving');
  if (!resisted) openModal('modal-slip');
  else {
    toast('Craving logged — you resisted!');
    renderDashboard();
    checkNewRanks();
  }
}

function bindEvents() {
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.nav));
  });

  $('#rank-dashboard-card')?.addEventListener('click', () => showView('rank'));
  $('#btn-craving')?.addEventListener('click', startCravingFlow);
  $('#btn-breathe')?.addEventListener('click', () => {
    closeModal('modal-craving');
    startBreathing();
  });
  $('#btn-craving-resisted')?.addEventListener('click', () => finishCraving(true));
  $('#btn-craving-gave-in')?.addEventListener('click', () => finishCraving(false));
  $('#btn-breath-done')?.addEventListener('click', () => {
    breathing?.stop();
    closeModal('modal-breathing');
  });
  $('#btn-breath-skip')?.addEventListener('click', () => {
    breathing?.stop();
    closeModal('modal-breathing');
    openModal('modal-craving');
  });

  $('#setup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.profile.displayName = $('#setup-name').value.trim() || 'Silvio';
    state.profile.quitDate = new Date($('#setup-quit').value).toISOString();
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
    if (q) state.profile.quitDate = new Date(q).toISOString();
    state.profile.cigsPerDay = Number($('#settings-cpd').value);
    state.profile.cigsPerPack = Number($('#settings-cpp').value);
    state.profile.packPrice = Number($('#settings-price').value);
    state.profile.currency = $('#settings-currency').value;
    persist();
    renderDashboard();
    toast('Settings saved');
  });

  $('#btn-reset-quit')?.addEventListener('click', () => {
    if (!confirm('Reset quit date to now? Your logs stay; stats recalculate from the new date.')) return;
    state.profile.quitDate = new Date().toISOString();
    persist();
    $('#settings-quit').value = new Date().toISOString().slice(0, 16);
    renderDashboard();
    toast('Quit date reset to now');
  });

  $('#btn-add-reason')?.addEventListener('click', () => {
    state.reasons.push({ id: uid(), text: 'My health' });
    persist();
    renderReasonsEditor();
  });

  document.body.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-reason]');
    if (del) {
      state.reasons = state.reasons.filter((r) => r.id !== del.dataset.delReason);
      persist();
      renderReasonsEditor();
    }
  });

  $('#reasons-editor')?.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-reason-id]');
    if (!input) return;
    const r = state.reasons.find((x) => x.id === input.dataset.reasonId);
    if (r) {
      r.text = input.value;
      persist();
      renderReasonsPreview();
    }
  });

  $('#goal-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.savingsGoal.name = $('#goal-name').value.trim();
    state.savingsGoal.targetAmount = Number($('#goal-amount').value) || 0;
    persist();
    renderGoalPreview();
    toast('Savings goal updated');
  });

  $('#slip-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.slips.push({
      id: uid(),
      at: Date.now(),
      count: Number($('#slip-count').value) || 1,
      note: $('#slip-note').value.trim(),
    });
    persist();
    $('#slip-count').value = '1';
    $('#slip-note').value = '';
    closeModal('modal-slip');
    renderDashboard();
    renderLog();
    checkNewRanks();
    toast('Slip logged — honesty keeps you moving forward.');
  });

  $('#btn-log-slip')?.addEventListener('click', () => openModal('modal-slip'));
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
  renderAll();
  startTicker();
  showView('home');

  if ('serviceWorker' in navigator) {
    const swUrl = new URL('sw.js', import.meta.url);
    navigator.serviceWorker.register(swUrl, { scope: './' }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', initApp);
