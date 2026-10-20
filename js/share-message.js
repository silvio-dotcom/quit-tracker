import { CURRENCIES, TIME_BACK_MINUTES_PER_CIG } from './constants.js';
import { msSinceQuit, cigarettesAvoided, moneySaved } from './stats.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MIN = 60 * 1000;

export function formatSmokeFreeShareLine(state, now = Date.now()) {
  const ms = msSinceQuit(state.profile, now);
  const days = Math.floor(ms / MS_PER_DAY);
  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} smoke-free`;
  const hours = Math.max(1, Math.floor(ms / MS_PER_HOUR));
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} smoke-free`;
}

export function formatMoneyShareWhole(state, now = Date.now()) {
  const amount = Math.round(moneySaved(state, now));
  const sym = CURRENCIES[state.profile.currency]?.symbol ?? '$';
  return `${sym}${amount} saved`;
}

export function formatTimeBack(cigsAvoided, minutesPerCig = TIME_BACK_MINUTES_PER_CIG) {
  const totalMin = Math.round(Math.max(0, cigsAvoided) * minutesPerCig);
  if (totalMin <= 0) return '0m of my time back';
  const days = Math.floor(totalMin / (24 * 60));
  const rem = totalMin % (24 * 60);
  const hours = Math.floor(rem / 60);
  const mins = rem % 60;
  if (days > 0) return `${days}d ${hours}h of my time back`;
  if (hours > 0) {
    if (mins > 0) return `${hours}h ${mins}m of my time back`;
    return `${hours}h of my time back`;
  }
  return `${mins}m of my time back`;
}

export function buildShareMessage(state, now = Date.now()) {
  const year = `${new Date(now).getFullYear()}!`;
  const cigs = cigarettesAvoided(state, now);
  return [
    year,
    '',
    formatSmokeFreeShareLine(state, now),
    '',
    `${cigs.toLocaleString()} cigarettes avoided`,
    '',
    formatMoneyShareWhole(state, now),
    '',
    formatTimeBack(cigs),
  ].join('\n');
}
