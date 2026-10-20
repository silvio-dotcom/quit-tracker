import { MINUTES_PER_CIG_LIFE, ACHIEVEMENTS } from './constants.js';
import { HEALTH_MILESTONES } from './health-milestones.js';

/** Daily cigarette rate is spread over waking hours only (QuitNow-style). */
export const WAKING_HOURS_PER_DAY = 16;
const MS_PER_HOUR = 60 * 60 * 1000;

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

export function cigarettesAvoided(state, now = Date.now()) {
  const ms = msSinceQuit(state.profile, now);
  const perDay = Number(state.profile.cigsPerDay) || 0;
  const perMs = perDay / (WAKING_HOURS_PER_DAY * MS_PER_HOUR);
  return Math.max(0, Math.floor(ms * perMs));
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
  const d = Math.floor((sec % (365.25 * 24 * 3600)) / 86400);
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

/** Days since quit date (inclusive of today). */
export function currentStreakDays(state, now = Date.now()) {
  if (!state.profile.quitDate) return 0;
  const quit = new Date(state.profile.quitDate);
  quit.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (today < quit) return 0;
  return Math.floor((today - quit) / 86400000) + 1;
}

export function bestStreakDays(state, now = Date.now()) {
  return Math.max(state.personalBestStreak || 0, currentStreakDays(state, now));
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
  const streak = currentStreakDays(state, now);

  return ACHIEVEMENTS.filter((a) => {
    switch (a.type) {
      case 'time':
        return ms >= a.ms;
      case 'cigs':
        return cigs >= a.count;
      case 'money':
        return money >= a.amount;
      case 'streak':
        return streak >= a.days;
      default:
        return false;
    }
  });
}

export function formatMoney(amount, currency, CURRENCIES) {
  const sym = CURRENCIES[currency]?.symbol ?? '$';
  return `${sym}${amount.toFixed(2)}`;
}

export function formatDayCount(days) {
  const n = Math.max(0, Math.floor(Number(days) || 0));
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}
