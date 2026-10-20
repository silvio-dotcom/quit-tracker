import { healthProgress } from './stats.js';
import { unlockedAchievements, syncAchievementUnlocks } from './achievements.js';
import { earnedChipKeys, chipStatuses } from './chips.js';
import { isNativePlatform } from './platform.js';
import { ensureAndroidNotificationPermission, syncNativeMilestoneSchedule } from './native-notifications.js';

const celebrationQueue = [];
let drainingCelebrations = false;

export function celebrationKey(type, id) {
  return `${type}:${id}`;
}

export function allUnlockedCelebrationKeys(state, now = Date.now()) {
  const keys = [];
  if (state.profile.quitDate) {
    healthProgress(now, state.profile.quitDate)
      .filter((m) => m.done)
      .forEach((m) => keys.push(celebrationKey('health', m.id)));
  }
  syncAchievementUnlocks(state, now);
  unlockedAchievements(state, now).forEach((a) => keys.push(celebrationKey('badge', a.id)));
  earnedChipKeys(state, now).forEach((k) => keys.push(k));
  return keys;
}

export async function postMilestoneNotification(title, body, tag) {
  if (isNativePlatform()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'SHOW_MILESTONE', title, body, tag });
  } catch {
    /* ignore */
  }
}

function showCelebrationModal({ icon, title, subtitle }, onClose) {
  const modal = document.querySelector('#modal-milestone');
  const iconEl = document.querySelector('#milestone-celebration-icon');
  const titleEl = document.querySelector('#milestone-celebration-title');
  const subEl = document.querySelector('#milestone-celebration-sub');
  const btn = document.querySelector('[data-close="modal-milestone"]');
  if (!modal || !btn) {
    onClose();
    return;
  }
  if (iconEl) iconEl.textContent = icon;
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  const done = () => {
    btn.removeEventListener('click', done);
    modal.classList.remove('open');
    if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
    onClose();
  };
  btn.addEventListener('click', done);
}

function drainCelebrationQueue() {
  if (drainingCelebrations || !celebrationQueue.length) return;
  drainingCelebrations = true;
  const item = celebrationQueue.shift();
  showCelebrationModal(item.celebration, () => {
    drainingCelebrations = false;
    drainCelebrationQueue();
  });
  if (item.notify) {
    postMilestoneNotification(item.notify.title, item.notify.body, item.notify.tag);
  }
}

/**
 * @param {object} state
 * @param {number} now
 * @param {(msg: string) => void} toast
 * @param {() => void} persist
 */
export function processMilestoneUnlocks(state, now, toast, persist) {
  if (!state.profile.quitDate) return;
  const seen = new Set(state.seenMilestoneCelebrations || []);
  const fresh = [];

  healthProgress(now, state.profile.quitDate)
    .filter((m) => m.done)
    .forEach((m) => {
      const key = celebrationKey('health', m.id);
      if (!seen.has(key)) fresh.push({
        key,
        celebration: { icon: '💚', title: 'Health milestone', subtitle: m.title },
        notify: {
          title: 'Health milestone reached',
          body: m.title,
          tag: key,
        },
      });
    });

  syncAchievementUnlocks(state, now);
  const badges = unlockedAchievements(state, now);
  const badgeIds = badges.map((a) => a.id);
  state.seenAchievements = [...new Set([...(state.seenAchievements || []), ...badgeIds])];

  badges.forEach((a) => {
    const key = celebrationKey('badge', a.id);
    if (!seen.has(key)) {
      fresh.push({
        key,
        celebration: { icon: a.icon, title: 'Badge unlocked', subtitle: a.title },
        notify: {
          title: 'Badge unlocked',
          body: a.title,
          tag: key,
        },
      });
    }
  });

  chipStatuses(state, now)
    .filter((s) => s.earned)
    .forEach((s) => {
      const key = `chip:${s.tier.id}`;
      if (!seen.has(key)) {
        fresh.push({
          key,
          celebration: { icon: '🪙', title: 'Chip earned', subtitle: `Your ${s.tier.notifyLabel}` },
          notify: {
            title: 'Smoke-free chip earned',
            body: `You earned your ${s.tier.notifyLabel}`,
            tag: key,
          },
          chipAnim: true,
        });
      }
    });

  if (!fresh.length) return;

  state.seenMilestoneCelebrations = [...seen, ...fresh.map((f) => f.key)];
  persist();

  const alertsOn = Boolean(state.milestoneAlertsEnabled);
  fresh.forEach((f) => {
    celebrationQueue.push({
      celebration: f.celebration,
      notify: alertsOn ? f.notify : null,
    });
  });
  drainCelebrationQueue();
  if (fresh.some((f) => f.chipAnim)) {
    window.__QT_CHIP_ANIM__ = true;
  }
  if (fresh.length === 1) {
    toast(`${fresh[0].celebration.icon} ${fresh[0].celebration.subtitle}`);
  }
}

export function migrateCelebrationsV14(state, now, persist) {
  if (state.celebrationMigrationV14) return;
  state.seenMilestoneCelebrations = allUnlockedCelebrationKeys(state, now);
  state.celebrationMigrationV14 = true;
  state.version = 4;
  persist();
}

export function migrateChipsV17(state, now, persist) {
  if (state.chipCelebrationMigrationV17) return;
  const seen = new Set(state.seenMilestoneCelebrations || []);
  earnedChipKeys(state, now).forEach((k) => seen.add(k));
  state.seenMilestoneCelebrations = [...seen];
  state.chipCelebrationMigrationV17 = true;
  state.version = 5;
  persist();
}

export async function setMilestoneAlertsEnabled(state, enabled, persist) {
  state.milestoneAlertsEnabled = enabled;
  if (enabled) {
    if (isNativePlatform()) {
      const perm = await ensureAndroidNotificationPermission();
      if (perm !== 'granted') {
        state.milestoneAlertsEnabled = false;
        persist();
        return perm;
      }
    } else if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        state.milestoneAlertsEnabled = false;
        persist();
        return perm;
      }
    }
  }
  persist();
  await syncNativeMilestoneSchedule(state);
  if (isNativePlatform()) {
    return state.milestoneAlertsEnabled ? 'granted' : 'denied';
  }
  return Notification?.permission ?? 'default';
}

export async function refreshMilestoneSchedules(state) {
  await syncNativeMilestoneSchedule(state);
}

export const MILESTONE_ALERTS_HELP =
  'Local alerts when a health milestone, smoke-free chip, or badge unlocks. Uses this device only — no push server. On iPhone/iPad, notifications work only if Quit Tracker is installed to your Home Screen (iOS 16.4+). In a Safari tab, you will still see in-app celebrations. On Android (this app), alerts are scheduled on your device at each upcoming unlock time.';
