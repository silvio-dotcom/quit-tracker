import { HEALTH_MILESTONES, healthBenefitDisplay } from './health-milestones.js';

/**
 * Cigarettes accrue only during waking hours (16h per 24h day), not while asleep.
 * Equivalent rate over calendar time: cigsPerDay × (elapsed / 24h).
 * Same as (waking hours elapsed) × (cigsPerDay / 16) with waking = elapsed × 16/24.
 */
export const WAKING_HOURS_PER_DAY = 16;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

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
  if (!perDay) return 0;
  return Math.max(0, Math.floor((ms * perDay) / MS_PER_DAY));
}

/** Milliseconds of smoke-free time to reach a cigarette count at the current daily rate. */
export function msForCigaretteTarget(count, cigsPerDay) {
  const cpd = Number(cigsPerDay) || 0;
  if (!cpd || count <= 0) return 0;
  return (count * MS_PER_DAY) / cpd;
}

export function moneySaved(state, now = Date.now()) {
  return cigarettesAvoided(state, now) * pricePerCig(state.profile);
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

/** Full 24-hour periods since quit instant (0 until 24h elapse). */
export function currentStreakDays(state, now = Date.now()) {
  if (!state.profile.quitDate) return 0;
  return Math.floor(msSinceQuit(state.profile, now) / MS_PER_DAY);
}

/** Streak label for UI: days when ≥1, otherwise hours/minutes under 24h. */
export function formatStreakDisplay(state, now = Date.now()) {
  if (!state.profile.quitDate) return formatDayCount(0);
  const ms = msSinceQuit(state.profile, now);
  const days = Math.floor(ms / MS_PER_DAY);
  if (days >= 1) return formatDayCount(days);
  if (ms <= 0) return formatDayCount(0);
  const hours = Math.floor(ms / MS_PER_HOUR);
  if (hours >= 1) return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  const mins = Math.floor(ms / (60 * 1000));
  if (mins >= 1) return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
  return formatDayCount(0);
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
    return {
      ...m,
      done,
      progress: Math.min(100, Math.max(0, pct)),
      displayBenefit: healthBenefitDisplay(m),
    };
  });
}

export function formatMoney(amount, currency, CURRENCIES) {
  const sym = CURRENCIES[currency]?.symbol ?? '$';
  return `${sym}${amount.toFixed(2)}`;
}

/** Projected savings if smoke-free for `days` at cigsPerDay × days cigarettes. */
export function projectedMoneySaved(state, days) {
  const cpd = Number(state.profile.cigsPerDay) || 0;
  const cigs = cpd * days;
  return cigs * pricePerCig(state.profile);
}

export const MONEY_PROJECTION_DAYS = [
  { label: '1 mo', days: 30 },
  { label: '6 mo', days: 182 },
  { label: '1 yr', days: 365 },
];

export function formatDayCount(days) {
  const n = Math.max(0, Math.floor(Number(days) || 0));
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}
