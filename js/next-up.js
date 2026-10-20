import { healthProgress, msSinceQuit, formatDuration } from './stats.js';
import {
  badgeStatuses,
  sortBadgesForDisplay,
  estimateUnlockTime,
} from './achievements.js';
import { moneyBadgeTitle } from './achievements.js';

export function formatCountdown(ms) {
  if (ms <= 0) return 'Now';
  const { label } = formatDuration(ms);
  return label;
}

export function getNextHealthMilestone(state, now = Date.now()) {
  if (!state.profile.quitDate) return null;
  const items = healthProgress(now, state.profile.quitDate);
  const next = items.find((m) => !m.done);
  if (!next) return null;
  const elapsed = msSinceQuit(state.profile, now);
  const remaining = Math.max(0, next.timeMs - elapsed);
  return { ...next, remainingMs: remaining, progress: next.progress };
}

export function getNextBadge(state, now = Date.now()) {
  const statuses = badgeStatuses(state, now);
  const locked = sortBadgesForDisplay(statuses.filter((s) => !s.unlocked));
  const next = locked[0];
  if (!next) return null;
  const unlockAt = estimateUnlockTime(next.achievement, state);
  const remainingMs = unlockAt
    ? Math.max(0, new Date(unlockAt).getTime() - now)
    : 0;
  return {
    achievement: next.achievement,
    progress: next.progress.pct,
    progressLabel: next.progressLabel,
    remainingMs,
  };
}

export function buildNextUpHtml(state, now, escapeHtml) {
  if (!state.profile.quitDate) {
    return '<p class="muted small">Complete setup to see what’s next.</p>';
  }
  const health = getNextHealthMilestone(state, now);
  const badge = getNextBadge(state, now);
  const rows = [];
  if (health) {
    rows.push(`
      <div class="next-up-row">
        <div class="next-up-row-head">
          <span class="next-up-tag">Health</span>
          <span class="next-up-countdown" aria-live="polite">${escapeHtml(formatCountdown(health.remainingMs))}</span>
        </div>
        <p class="next-up-title">${escapeHtml(health.title)}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${health.progress}%"></div></div>
      </div>`);
  }
  if (badge) {
    const title =
      badge.achievement.category === 'money'
        ? moneyBadgeTitle(badge.achievement, state.profile.currency)
        : badge.achievement.title;
    rows.push(`
      <div class="next-up-row">
        <div class="next-up-row-head">
          <span class="next-up-tag">Badge ${badge.achievement.icon}</span>
          <span class="next-up-countdown" aria-live="polite">${escapeHtml(formatCountdown(badge.remainingMs))}</span>
        </div>
        <p class="next-up-title">${escapeHtml(title)}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${badge.progress}%"></div></div>
      </div>`);
  }
  if (!rows.length) {
    return '<p class="muted small">All milestones and badges unlocked — amazing.</p>';
  }
  return rows.join('');
}
