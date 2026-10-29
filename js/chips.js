import { BASE_SMOKE_FREE_CHIPS, MAX_CHIP_TIER, MAX_CHIP_MS } from './constants.js';
import { formatLocaleDate } from './locale.js';

export { MAX_CHIP_MS, MAX_CHIP_TIER };

/** All chip tiers (fixed 12-step ladder through 1 year). */
export function allChipTiers() {
  return BASE_SMOKE_FREE_CHIPS;
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
  const tiers = allChipTiers();
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

export function isAtMaxChip(state, now = Date.now()) {
  const top = highestEarnedChip(state, now);
  return top?.tier.id === MAX_CHIP_TIER.id;
}

export function nextChipTarget(state, now = Date.now()) {
  const quit = state.profile.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return null;
  const tiers = allChipTiers();
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
  return allChipTiers()
    .map((tier) => ({
      tier,
      at: chipEarnedAtMs(quit, tier.ms),
    }))
    .filter((x) => x.at > now)
    .map((x) => ({
      key: `chip:${x.tier.id}`,
      at: x.at,
      title: 'Medalla sin fumar',
      body: `Ganaste tu ${x.tier.notifyLabel}`,
    }));
}

export function formatChipRemaining(ms) {
  if (ms <= 0) return 'Ahora';
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
  return formatLocaleDate(ts, { month: 'short', day: 'numeric', year: 'numeric' });
}
