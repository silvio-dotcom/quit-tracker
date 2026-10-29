import { healthProgress } from './stats.js';
import { unlockedAchievements, syncAchievementUnlocks, badgeDisplayTitle } from './achievements.js';
import { earnedChipKeys, chipStatuses } from './chips.js';
import { isChipHealthUnlockTier, chipHealthFact } from './chip-health-unlocks.js';
import { isNativePlatform } from './platform.js';
import { ensureAndroidNotificationPermission, syncNativeMilestoneSchedule } from './native-notifications.js';
import { showChipHealthUnlockModal } from './chip-health-unlock-ui.js';

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

function showCelebrationModal({ icon, title, subtitle, badgePop }, onClose) {
  const modal = document.querySelector('#modal-milestone');
  const iconEl = document.querySelector('#milestone-celebration-icon');
  const titleEl = document.querySelector('#milestone-celebration-title');
  const subEl = document.querySelector('#milestone-celebration-sub');
  const btn = document.querySelector('[data-close="modal-milestone"]');
  if (!modal || !btn) {
    onClose();
    return;
  }
  if (iconEl) {
    iconEl.textContent = icon;
    iconEl.classList.toggle('milestone-icon-pop', Boolean(badgePop));
    if (badgePop) {
      window.setTimeout(() => iconEl.classList.remove('milestone-icon-pop'), 700);
    }
  }
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
  const onDone = () => {
    drainingCelebrations = false;
    drainCelebrationQueue();
  };
  if (item.chipHealthTier) {
    showChipHealthUnlockModal(item.chipHealthTier, onDone);
  } else {
    showCelebrationModal(item.celebration, onDone);
  }
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
        celebration: { icon: '💚', title: 'Hito de salud', subtitle: m.title },
        notify: {
          title: 'Hito de salud alcanzado',
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
        celebration: {
          icon: a.icon,
          title: 'Medalla desbloqueada',
          subtitle: badgeDisplayTitle(a, state.profile.currency),
          badgePop: true,
        },
        notify: {
          title: 'Medalla desbloqueada',
          body: badgeDisplayTitle(a, state.profile.currency),
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
        const healthFact = isChipHealthUnlockTier(s.tier.id) ? chipHealthFact(s.tier.id) : null;
        fresh.push({
          key,
          chipHealthTier: healthFact ? s.tier : null,
          celebration: healthFact
            ? null
            : { icon: '🪙', title: 'Medalla ganada', subtitle: `Tu ${s.tier.notifyLabel}` },
          notify: {
            title: healthFact ? 'Hito de salud' : 'Medalla sin fumar',
            body: healthFact || `Ganaste tu ${s.tier.notifyLabel}`,
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
      chipHealthTier: f.chipHealthTier,
      notify: alertsOn ? f.notify : null,
    });
  });
  drainCelebrationQueue();
  if (fresh.some((f) => f.chipAnim)) {
    window.__QT_CHIP_ANIM__ = true;
  }
  if (fresh.length === 1) {
    const f = fresh[0];
    if (f.chipHealthTier) {
      toast(`💚 ${f.chipHealthTier.label}`);
    } else if (f.celebration) {
      toast(`${f.celebration.icon} ${f.celebration.subtitle}`);
    }
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
  'Alertas locales cuando se desbloquea un hito de salud, una medalla sin fumar o una medalla. Solo en este dispositivo — sin servidor push. En iPhone/iPad, las notificaciones funcionan si Quit Tracker está en la pantalla de inicio (iOS 16.4+). En una pestaña de Safari, igual verás celebraciones en la app. En Android (esta app), las alertas se programan en tu dispositivo en cada próximo desbloqueo.';
