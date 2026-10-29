import {
  BADGE_CATEGORIES,
  badgeStatuses,
  syncAchievementUnlocks,
  badgeDisplayTitle,
  badgeDisplayDesc,
  formatUnlockDate,
  badgeUnlockIso,
  selectNextLockedBadge,
  sortEarnedBadgesNewest,
  sortLockedBadgesByEta,
  formatBadgeEta,
} from './achievements.js';
import { xpLevelProgress, MAX_LEVEL } from './xp.js';

export const BADGE_FILTER_ALL = 'all';

export function displayBadgeTitle(achievement, currency) {
  return badgeDisplayTitle(achievement, currency);
}

function badgeCardHtml(s, state, now, escapeHtml, { featured = false } = {}) {
  const a = s.achievement;
  const title = escapeHtml(displayBadgeTitle(a, state.profile.currency));
  const desc = escapeHtml(badgeDisplayDesc(a));
  const pct = Math.round(s.progress.pct);
  const eta = escapeHtml(formatBadgeEta(s, state, now));

  if (s.unlocked) {
    const when = badgeUnlockIso(s, state);
    const date = when ? escapeHtml(formatUnlockDate(when)) : '';
    return `<article class="badge badge-earned ${featured ? 'badge-featured' : ''}">
      <div class="badge-icon-wrap badge-icon-earned" aria-hidden="true">
        <span class="badge-pixel-icon">${a.icon}</span>
        <span class="badge-check">✓</span>
      </div>
      <div class="badge-title pixel-label">${title}</div>
      <div class="badge-desc">${desc}</div>
      ${date ? `<p class="badge-unlocked-date">${date}</p>` : ''}
    </article>`;
  }

  return `<article class="badge badge-locked ${featured ? 'badge-featured' : ''}">
    <div class="badge-icon-wrap badge-icon-locked" aria-hidden="true">
      <span class="badge-pixel-icon">${a.icon}</span>
    </div>
    <div class="badge-title pixel-label">${title}</div>
    <div class="badge-desc">${desc}</div>
    <div class="badge-progress-track"><div class="badge-progress-fill" style="width:${pct}%"></div></div>
    <p class="badge-progress-meta"><span class="badge-pct">${pct}%</span><span class="badge-eta">${eta}</span></p>
  </article>`;
}

function nextUpCardHtml(next, state, now, escapeHtml) {
  if (!next) return '';
  const a = next.achievement;
  const title = escapeHtml(displayBadgeTitle(a, state.profile.currency));
  const pct = Math.round(next.progress.pct);
  const eta = escapeHtml(formatBadgeEta(next, state, now));
  return `<section class="badge-next-up card" aria-labelledby="badge-next-up-title">
    <p class="badge-next-up-kicker pixel-label">Próximo</p>
    <div class="badge-next-up-inner">
      <div class="badge-next-up-icon" aria-hidden="true">${a.icon}</div>
      <div class="badge-next-up-body">
        <h3 id="badge-next-up-title" class="badge-next-up-title pixel-label">${title}</h3>
        <p class="badge-next-up-desc muted">${escapeHtml(badgeDisplayDesc(a))}</p>
        <div class="badge-progress-track lg"><div class="badge-progress-fill" style="width:${pct}%"></div></div>
        <p class="badge-progress-meta"><span class="badge-pct">${pct}%</span><span class="badge-eta">${eta}</span></p>
      </div>
    </div>
  </section>`;
}

export function renderBadgesScreen({
  state,
  now = Date.now(),
  filter = BADGE_FILTER_ALL,
  escapeHtml,
  onFilterChange,
}) {
  syncAchievementUnlocks(state, now);
  const statuses = badgeStatuses(state, now);
  const filtered =
    filter === BADGE_FILTER_ALL
      ? statuses
      : statuses.filter((s) => s.achievement.category === filter);

  const next = selectNextLockedBadge(statuses, state, now, filter);
  const earned = sortEarnedBadgesNewest(filtered.filter((s) => s.unlocked), state);
  const locked = sortLockedBadgesByEta(
    filtered.filter((s) => !s.unlocked && s.achievement.id !== next?.achievement.id),
    state,
    now
  );
  const unlockedTotal = statuses.filter((s) => s.unlocked).length;
  const xp = xpLevelProgress(state, now);
  const xpPct = xp.need > 0 ? Math.min(100, (xp.into / xp.need) * 100) : 100;

  const filters = [
    { id: BADGE_FILTER_ALL, label: 'Todas' },
    ...BADGE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  const filterHtml = filters
    .map(
      (f) =>
        `<button type="button" class="badge-filter-chip ${f.id === filter ? 'active' : ''}" data-badge-filter="${f.id}">${escapeHtml(f.label)}</button>`
    )
    .join('');

  const earnedHtml = earned.length
    ? earned.map((s) => badgeCardHtml(s, state, now, escapeHtml)).join('')
    : '<p class="muted small badge-empty">Aún no hay medallas en esta categoría.</p>';

  const lockedHtml = locked.length
    ? locked.map((s) => badgeCardHtml(s, state, now, escapeHtml)).join('')
    : '<p class="muted small badge-empty">Todas las medallas de esta vista están ganadas — ¡bien!</p>';

  return {
    summary: `${unlockedTotal} / ${statuses.length} ganadas`,
    levelHtml: `<div class="badge-level-bar ${xp.maxed ? 'badge-level-max' : ''}">
      <div class="badge-level-head">
        <span class="pixel-label">LV ${xp.level} / ${MAX_LEVEL}${xp.maxed ? ' MAX' : ''}</span>
        <span class="badge-level-title pixel-label">${escapeHtml(xp.title)}</span>
      </div>
      <div class="progress-track"><div class="progress-fill rank" style="width:${xpPct}%"></div></div>
      <p class="badge-level-xp muted small">${xp.maxed ? 'Nivel máximo — estatus leyenda' : `${xp.into} / ${xp.need} XP`}</p>
    </div>`,
    filterHtml,
    bodyHtml: `${nextUpCardHtml(next, state, now, escapeHtml)}
      <section class="badge-list-section" aria-labelledby="badge-earned-heading">
        <h3 id="badge-earned-heading" class="badge-list-heading">Ganadas <span class="muted">(${earned.length})</span></h3>
        <div class="badge-grid">${earnedHtml}</div>
      </section>
      <section class="badge-list-section" aria-labelledby="badge-locked-heading">
        <h3 id="badge-locked-heading" class="badge-list-heading">Bloqueadas <span class="muted">(${locked.length})</span></h3>
        <div class="badge-grid">${lockedHtml}</div>
      </section>`,
    bindFilters(root) {
      root.querySelectorAll('[data-badge-filter]').forEach((btn) => {
        btn.addEventListener('click', () => onFilterChange?.(btn.dataset.badgeFilter));
      });
    },
  };
}

export function homeLevelPillHtml(state, now, escapeHtml) {
  const xp = xpLevelProgress(state, now);
  const label = xp.maxed ? `LV ${xp.level} / ${MAX_LEVEL} MAX` : `LV ${xp.level} / ${MAX_LEVEL}`;
  return `<span class="home-level-pill pixel-label" title="${escapeHtml(xp.title)}">${label}</span>`;
}
