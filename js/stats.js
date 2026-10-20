import { MINUTES_PER_CIG_LIFE, ACHIEVEMENTS } from './constants.js';
import { HEALTH_MILESTONES } from './health-milestones.js';

export function pricePerCig(profile) {
  const pack = Number(profile.cigsPerPack) || 20;
  const price = Number(profile.packPrice) || 0;
  return price / pack;
}

export function msSinceQuit(profile, now = Date.now()) {
  if (!profile.quitDate) return 0;
  const t = new Date(profile.quitDate).getTime();
  return Math.max(0, now - t);
}

export function expectedCigsSmoked(profile, now = Date.now()) {
  const ms = msSinceQuit(profile, now);
  const perDay = Number(profile.cigsPerDay) || 0;
  const perMs = perDay / (24 * 60 * 60 * 1000);
  return ms * perMs;
}

export function totalSlipCigs(slips) {
  return (slips || []).reduce((s, x) => s + (Number(x.count) || 0), 0);
}

export function cigarettesAvoided(state, now = Date.now()) {
  const expected = expectedCigsSmoked(state.profile, now);
  const slipped = totalSlipCigs(state.slips);
  return Math.max(0, Math.floor(expected - slipped));
}

export function moneySaved(state, now = Date.now()) {
  return cigarettesAvoided(state, now) * pricePerCig(state.profile);
}

export function lifeRegainedMinutes(state, now = Date.now()) {
  return cigarettesAvoided(state, now) * MINUTES_PER_CIG_LIFE;
}

export function formatDuration(ms) {
  if (ms <= 0) return { parts: [{ v: 0, u: 'sec' }], label: '0s' };
  const sec = Math.floor(ms / 1000);
  const y = Math.floor(sec / (365.25 * 24 * 3600));
  const d = Math.floor((sec % (365.25 * 24 * 3600)) / (86400));
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (y) parts.push({ v: y, u: y === 1 ? 'year' : 'years' });
  if (d) parts.push({ v: d, u: d === 1 ? 'day' : 'days' });
  if (h) parts.push({ v: h, u: h === 1 ? 'hr' : 'hrs' });
  if (m) parts.push({ v: m, u: 'min' });
  if (!y && !d && !h) parts.push({ v: s, u: 'sec' });
  const label = parts.slice(0, 3).map((p) => `${p.v} ${p.u}`).join(' ');
  return { parts, label };
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Current streak: consecutive local days with no slip (including today if clean). */
export function currentStreakDays(state, now = Date.now()) {
  const slipDays = new Set((state.slips || []).map((s) => dayKey(s.at)));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 5000; i++) {
    const key = dayKey(cursor.getTime());
    const quit = state.profile.quitDate ? new Date(state.profile.quitDate) : null;
    if (quit) {
      quit.setHours(0, 0, 0, 0);
      if (cursor < quit) break;
    }
    if (slipDays.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreakDays(state) {
  const slipDays = new Set((state.slips || []).map((s) => dayKey(s.at)));
  if (!state.profile.quitDate) return 0;
  const start = new Date(state.profile.quitDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  let best = 0;
  let run = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (slipDays.has(dayKey(cur.getTime()))) {
      best = Math.max(best, run);
      run = 0;
    } else {
      run++;
      best = Math.max(best, run);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return best;
}

export function cravingsResistedCount(state) {
  return (state.cravings || []).filter((c) => c.resisted).length;
}

export function healthProgress(now, quitDate) {
  if (!quitDate) return [];
  const elapsed = Math.max(0, now - new Date(quitDate).getTime());
  return HEALTH_MILESTONES.map((m, i) => {
    const prevMs = i > 0 ? HEALTH_MILESTONES[i - 1].timeMs : 0;
    const done = elapsed >= m.timeMs;
    let pct = 0;
    if (done) pct = 100;
    else if (elapsed > prevMs && m.timeMs > prevMs) pct = ((elapsed - prevMs) / (m.timeMs - prevMs)) * 100;
    return { ...m, done, progress: Math.min(100, Math.max(0, pct)) };
  });
}

export function unlockedAchievements(state, now = Date.now()) {
  const ms = msSinceQuit(state.profile, now);
  const cigs = cigarettesAvoided(state, now);
  const money = moneySaved(state, now);
  const resisted = cravingsResistedCount(state);
  const streak = currentStreakDays(state, now);

  return ACHIEVEMENTS.filter((a) => {
    switch (a.type) {
      case 'time':
        return ms >= a.ms;
      case 'cigs':
        return cigs >= a.count;
      case 'money':
        return money >= a.amount;
      case 'cravings':
        return resisted >= a.count;
      case 'streak':
        return streak >= a.days;
      default:
        return false;
    }
  });
}

export function dailySeries(state, days = 14, now = Date.now()) {
  const labels = [];
  const cravings = [];
  const slips = [];
  const money = [];
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const key = dayKey(cursor.getTime());
    labels.push(cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    cravings.push((state.cravings || []).filter((c) => dayKey(c.at) === key).length);
    slips.push(
      (state.slips || []).filter((s) => dayKey(s.at) === key).reduce((n, s) => n + (Number(s.count) || 0), 0)
    );
    const endOfDay = new Date(cursor);
    endOfDay.setHours(23, 59, 59, 999);
    money.push(moneySaved(state, endOfDay.getTime()));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { labels, cravings, slips, money };
}

export function formatMoney(amount, currency, CURRENCIES) {
  const sym = CURRENCIES[currency]?.symbol ?? '$';
  return `${sym}${amount.toFixed(2)}`;
}
