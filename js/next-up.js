import { healthProgress, msSinceQuit } from './stats.js';
import {
  badgeStatuses,
  sortLockedBadgesByEta,
  estimateUnlockTime,
} from './achievements.js';
import { badgeDisplayTitle } from './achievements.js';

export function formatHealthMilestoneAt(title) {
  const t = String(title || '').trim();
  if (!t) return '';
  return `at ${t}`;
}

export function formatCountdown(ms) {
  if (ms <= 0) return 'Now';
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${sec}s`;
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
  const locked = sortLockedBadgesByEta(statuses.filter((s) => !s.unlocked), state, now);
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
    const atLabel = formatHealthMilestoneAt(health.title);
    rows.push(`
      <div class="next-up-row next-up-row-health">
        <div class="next-up-row-head">
          <span class="next-up-tag">Health</span>
          <span class="next-up-countdown" aria-live="polite">${escapeHtml(formatCountdown(health.remainingMs))}</span>
        </div>
        <p class="next-up-health-benefit">${escapeHtml(health.displayBenefit)}</p>
        <p class="next-up-health-at muted">${escapeHtml(atLabel)}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${health.progress}%"></div></div>
      </div>`);
  }
  if (badge) {
    const title = badgeDisplayTitle(badge.achievement, state.profile.currency);
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
