import { HEALTH_MILESTONES } from './health-milestones.js';
import { achievementsForState, estimateUnlockTime, metricsForBadges, isBadgeUnlocked } from './achievements.js';
import { upcomingChipNotifications } from './chips.js';

export function notificationIdForKey(key) {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = (h * 33) ^ key.charCodeAt(i);
  return Math.abs(h % 2000000000) + 1;
}

/**
 * Upcoming milestone notifications (health + badges not yet reached).
 * @returns {Array<{ key: string, id: number, at: number, title: string, body: string }>}
 */
export function upcomingMilestoneNotifications(state, now = Date.now()) {
  const quit = state.profile.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return [];
  const out = [];
  const metrics = metricsForBadges(state, now);

  for (const m of HEALTH_MILESTONES) {
    const at = quit + m.timeMs;
    if (at <= now) continue;
    const key = `health:${m.id}`;
    out.push({
      key,
      id: notificationIdForKey(key),
      at,
      title: 'Health milestone reached',
      body: m.title,
    });
  }

  for (const a of achievementsForState(state)) {
    if (isBadgeUnlocked(a, metrics, state)) continue;
    const iso = estimateUnlockTime(a, state);
    if (!iso) continue;
    const at = new Date(iso).getTime();
    if (at <= now) continue;
    const key = `badge:${a.id}`;
    out.push({
      key,
      id: notificationIdForKey(key),
      at,
      title: 'Badge unlocked',
      body: a.title,
    });
  }

  for (const chip of upcomingChipNotifications(state, now)) {
    out.push({
      key: chip.key,
      id: notificationIdForKey(chip.key),
      at: chip.at,
      title: chip.title,
      body: chip.body,
    });
  }

  out.sort((a, b) => a.at - b.at);
  return out;
}
