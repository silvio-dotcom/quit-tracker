import { BASE_SMOKE_FREE_CHIPS, BRONZE_MEDALLION_PALETTE } from './constants.js';
import { msSinceQuit } from './stats.js';

const MS_DAY = 24 * 60 * 60 * 1000;

export function yearChipTier(years) {
  return {
    id: `chip-${years}y`,
    label: `${years} YEARS`,
    shortLabel: `${years} yr`,
    notifyLabel: `${years}-year medallion`,
    ms: years * 365 * MS_DAY,
    kind: 'medallion',
    palette: BRONZE_MEDALLION_PALETTE,
  };
}

/** All tiers to show (base + yearly bronze from 2y up to maxYears). */
export function allChipTiers(now = Date.now(), quitDate = null, maxExtraYears = 3) {
  const tiers = [...BASE_SMOKE_FREE_CHIPS];
  if (!quitDate) return tiers;
  const elapsed = msSinceQuit({ quitDate }, now);
  const currentYears = Math.floor(elapsed / (365 * MS_DAY));
  const cap = Math.max(2, currentYears + maxExtraYears);
  for (let y = 2; y <= cap; y++) {
    tiers.push(yearChipTier(y));
  }
  return tiers;
}

export function chipEarnedAtMs(quitMs, tierMs) {
  return quitMs + tierMs;
}

export function isChipEarned(quitMs, tierMs, now = Date.now()) {
  return now >= chipEarnedAtMs(quitMs, tierMs);
}

export function chipStatuses(state, now = Date.now()) {
  const quit = state.profile.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return [];
  const tiers = allChipTiers(now, state.profile.quitDate);
  return tiers.map((tier) => {
    const earned = isChipEarned(quit, tier.ms, now);
    const earnedAt = earned ? chipEarnedAtMs(quit, tier.ms) : null;
    const remainingMs = earned ? 0 : Math.max(0, chipEarnedAtMs(quit, tier.ms) - now);
    return { tier, earned, earnedAt, remainingMs };
  });
}

export function highestEarnedChip(state, now = Date.now()) {
  const statuses = chipStatuses(state, now).filter((s) => s.earned);
  if (!statuses.length) return null;
  return statuses.reduce((a, b) => (b.tier.ms > a.tier.ms ? b : a));
}

export function nextChipTarget(state, now = Date.now()) {
  const quit = state.profile.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return null;
  const tiers = allChipTiers(now, state.profile.quitDate);
  const next = tiers.find((t) => !isChipEarned(quit, t.ms, now));
  if (!next) return null;
  const elapsed = now - quit;
  const progress = next.ms > 0 ? Math.min(100, (elapsed / next.ms) * 100) : 0;
  const remainingMs = Math.max(0, chipEarnedAtMs(quit, next.ms) - now);
  return { tier: next, progress, remainingMs };
}

export function earnedChipKeys(state, now = Date.now()) {
  return chipStatuses(state, now)
    .filter((s) => s.earned)
    .map((s) => `chip:${s.tier.id}`);
}

export function upcomingChipNotifications(state, now = Date.now()) {
  const quit = state.profile.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return [];
  return allChipTiers(now, state.profile.quitDate)
    .map((tier) => ({
      tier,
      at: chipEarnedAtMs(quit, tier.ms),
    }))
    .filter((x) => x.at > now)
    .map((x) => ({
      key: `chip:${x.tier.id}`,
      at: x.at,
      title: 'Smoke-free chip earned',
      body: `You earned your ${x.tier.notifyLabel}`,
    }));
}

export function formatChipRemaining(ms) {
  if (ms <= 0) return 'Now';
  const h = Math.floor(ms / (60 * 60 * 1000));
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d`;
  }
  if (h >= 1) return `${h}h`;
  const m = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${m}m`;
}

export function formatChipEarnedDate(ts) {
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}
