import { isNativePlatform } from './platform.js';
import { upcomingMilestoneNotifications } from './milestone-schedule.js';

const CHANNEL_ID = 'quit-tracker-milestones';

function plugin() {
  return window.Capacitor?.Plugins?.LocalNotifications ?? null;
}

export async function ensureAndroidNotificationPermission() {
  const LN = plugin();
  if (!LN) return 'denied';
  const check = await LN.checkPermissions();
  if (check.display === 'granted') return 'granted';
  const req = await LN.requestPermissions();
  return req.display === 'granted' ? 'granted' : 'denied';
}

async function ensureChannel() {
  const LN = plugin();
  if (!LN) return;
  try {
    await LN.createChannel({
      id: CHANNEL_ID,
      name: 'Milestone alerts',
      description: 'Health milestones and badge unlocks',
      importance: 4,
      visibility: 1,
    });
  } catch {
    /* channel may already exist */
  }
}

function buildNotificationPayload(upcoming, exact) {
  return upcoming.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    channelId: CHANNEL_ID,
    extra: { key: item.key },
    schedule: { at: new Date(item.at), allowWhileIdle: exact },
  }));
}

async function scheduleWithExactFallback(LN, upcoming) {
  try {
    await LN.schedule({ notifications: buildNotificationPayload(upcoming, true) });
    return;
  } catch {
    /* SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM not granted — inexact fallback */
  }
  try {
    await LN.schedule({ notifications: buildNotificationPayload(upcoming, false) });
  } catch {
    /* ignore */
  }
}

/** Cancel all pending milestone notifications and reschedule from state. */
export async function syncNativeMilestoneSchedule(state) {
  if (!isNativePlatform()) return;
  const LN = plugin();
  if (!LN) return;

  if (!state.milestoneAlertsEnabled || !state.profile.quitDate) {
    try {
      const pending = await LN.getPending();
      const ids = (pending.notifications || []).map((n) => n.id);
      if (ids.length) await LN.cancel({ notifications: ids.map((id) => ({ id })) });
    } catch {
      /* ignore */
    }
    return;
  }

  const perm = await ensureAndroidNotificationPermission();
  if (perm !== 'granted') return;

  await ensureChannel();

  const now = Date.now();
  const upcoming = upcomingMilestoneNotifications(state, now);

  try {
    const pending = await LN.getPending();
    const ids = (pending.notifications || []).map((n) => n.id);
    if (ids.length) await LN.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    /* ignore */
  }

  if (!upcoming.length) return;

  await scheduleWithExactFallback(LN, upcoming);
}
