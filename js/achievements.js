import {
  ACHIEVEMENTS,
  BADGE_CATEGORIES,
  ACHIEVEMENT_IDS,
  LEGACY_ACHIEVEMENT_IDS,
  CURRENCIES,
} from './constants.js';
import {
  msSinceQuit,
  cigarettesAvoided,
  moneySaved,
  msForCigaretteTarget,
} from './stats.js';

const MS_PER_HOUR = 60 * 60 * 1000;

export function migrateSeenAchievementIds(seen) {
  if (!Array.isArray(seen)) return [];
  const out = [];
  for (const id of seen) {
    if (ACHIEVEMENT_IDS.has(id)) out.push(id);
    else if (LEGACY_ACHIEVEMENT_IDS[id]) out.push(LEGACY_ACHIEVEMENT_IDS[id]);
  }
  return [...new Set(out)];
}

export function migrateAchievementUnlocks(unlocks, seen) {
  const base = unlocks && typeof unlocks === 'object' ? { ...unlocks } : {};
  const migrated = {};
  for (const [key, val] of Object.entries(base)) {
    const id = ACHIEVEMENT_IDS.has(key) ? key : LEGACY_ACHIEVEMENT_IDS[key];
    if (id && ACHIEVEMENT_IDS.has(id) && val) migrated[id] = val;
  }
  for (const id of migrateSeenAchievementIds(seen || [])) {
    if (!migrated[id]) migrated[id] = null;
  }
  return migrated;
}

export function cigaretteTargetForBadge(achievement, state) {
  if (achievement.packs != null) {
    const cpp = Number(state.profile.cigsPerPack) || 20;
    return achievement.packs * cpp;
  }
  return achievement.count ?? 0;
}

export function metricsForBadges(state, now = Date.now()) {
  return {
    smokeFreeMs: msSinceQuit(state.profile, now),
    cigarettes: cigarettesAvoided(state, now),
    money: moneySaved(state, now),
    currency: state.profile.currency,
  };
}

export function isBadgeUnlocked(achievement, metrics, state) {
  switch (achievement.category) {
    case 'time':
      return metrics.smokeFreeMs >= (achievement.ms ?? 0);
    case 'cigs':
      return metrics.cigarettes >= cigaretteTargetForBadge(achievement, state);
    case 'money':
      return metrics.money >= (achievement.amount ?? 0);
    default:
      return false;
  }
}

export function badgeProgress(achievement, metrics, state) {
  let current = 0;
  let target = 1;
  switch (achievement.category) {
    case 'time':
      current = metrics.smokeFreeMs;
      target = achievement.ms ?? 1;
      break;
    case 'cigs':
      current = metrics.cigarettes;
      target = cigaretteTargetForBadge(achievement, state);
      break;
    case 'money':
      current = metrics.money;
      target = achievement.amount ?? 1;
      break;
    default:
      break;
  }
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return { current, target, pct };
}

function formatDurationShort(ms) {
  const sec = Math.floor(ms / 1000);
  const y = Math.floor(sec / (365 * 24 * 3600));
  const mo = Math.floor((sec % (365 * 24 * 3600)) / (30 * 24 * 3600));
  const d = Math.floor((sec % (30 * 24 * 3600)) / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (y) return `${y}y`;
  if (mo) return `${mo}mo`;
  if (d) return `${d}d`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return `${sec}s`;
}

function formatTimeTarget(ms) {
  const sec = Math.floor(ms / 1000);
  const y = Math.floor(sec / (365 * 24 * 3600));
  const mo = Math.floor((sec % (365 * 24 * 3600)) / (30 * 24 * 3600));
  const d = Math.floor((sec % (30 * 24 * 3600)) / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  if (y) return `${y} ${y === 1 ? 'year' : 'years'}`;
  if (mo) return `${mo} ${mo === 1 ? 'month' : 'months'}`;
  if (d) return `${d} ${d === 1 ? 'day' : 'days'}`;
  if (h) return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  const m = Math.floor((sec % 3600) / 60);
  if (m) return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  return `${sec} sec`;
}

export function badgeProgressLabel(achievement, metrics, state) {
  const { current, target } = badgeProgress(achievement, metrics, state);
  switch (achievement.category) {
    case 'time':
      return `${formatDurationShort(current)} / ${formatTimeTarget(target)}`;
    case 'cigs':
      return `${Math.floor(current).toLocaleString()} / ${Math.floor(target).toLocaleString()} cigarettes`;
    case 'money': {
      const sym = CURRENCIES[metrics.currency]?.symbol ?? '$';
      const fmt = (n) => `${sym}${n.toFixed(0)}`;
      return `${fmt(current)} of ${fmt(target)}`;
    }
    default:
      return '';
  }
}

export function moneyBadgeTitle(achievement, currency) {
  const sym = CURRENCIES[currency]?.symbol ?? '$';
  const amt = achievement.amount ?? 0;
  const label = amt >= 1000 ? amt.toLocaleString() : String(amt);
  return `${sym}${label} saved`;
}

export function estimateUnlockTime(achievement, state) {
  const quit = state.profile.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return null;
  if (achievement.category === 'time') {
    return new Date(quit + (achievement.ms ?? 0)).toISOString();
  }
  const cpd = Number(state.profile.cigsPerDay) || 0;
  if (!cpd) return null;
  if (achievement.category === 'cigs') {
    const target = cigaretteTargetForBadge(achievement, state);
    return new Date(quit + msForCigaretteTarget(target, cpd)).toISOString();
  }
  if (achievement.category === 'money') {
    const ppc = (Number(state.profile.packPrice) || 0) / (Number(state.profile.cigsPerPack) || 20);
    if (!ppc) return null;
    const cigsNeeded = (achievement.amount ?? 0) / ppc;
    return new Date(quit + msForCigaretteTarget(cigsNeeded, cpd)).toISOString();
  }
  return null;
}

export function formatUnlockDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function unlockedAchievements(state, now = Date.now()) {
  const metrics = metricsForBadges(state, now);
  return ACHIEVEMENTS.filter((a) => isBadgeUnlocked(a, metrics, state));
}

/**
 * @returns {Array<{ achievement, unlocked, progress, progressLabel, unlockAt, sortKey }>}
 */
export function badgeStatuses(state, now = Date.now()) {
  const metrics = metricsForBadges(state, now);
  const unlocks = state.achievementUnlocks || {};
  return ACHIEVEMENTS.map((achievement) => {
    const unlocked = isBadgeUnlocked(achievement, metrics, state);
    const progress = badgeProgress(achievement, metrics, state);
    const progressLabel = unlocked ? '' : badgeProgressLabel(achievement, metrics, state);
    const unlockAt = unlocked ? unlocks[achievement.id] || null : null;
    const sortKey = unlocked ? 1 : 0;
    const proximity = unlocked ? 0 : progress.pct;
    return { achievement, unlocked, progress, progressLabel, unlockAt, sortKey, proximity };
  });
}

export function sortBadgesForDisplay(items) {
  return [...items].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
    if (!a.unlocked && !b.unlocked) return b.proximity - a.proximity;
    const at = a.unlockAt ? new Date(a.unlockAt).getTime() : 0;
    const bt = b.unlockAt ? new Date(b.unlockAt).getTime() : 0;
    return bt - at;
  });
}

export function syncAchievementUnlocks(state, now = Date.now()) {
  const metrics = metricsForBadges(state, now);
  if (!state.achievementUnlocks) state.achievementUnlocks = {};
  let changed = false;
  for (const a of ACHIEVEMENTS) {
    if (!isBadgeUnlocked(a, metrics, state)) continue;
    if (!state.achievementUnlocks[a.id]) {
      state.achievementUnlocks[a.id] = estimateUnlockTime(a, state) || new Date(now).toISOString();
      changed = true;
    }
  }
  return changed;
}

export { ACHIEVEMENTS, BADGE_CATEGORIES };
