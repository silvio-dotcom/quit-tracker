/**
 * Personal rank ladder — smoke-free time only (future leaderboard-ready).
 */

import { msSinceQuit, currentStreakDays, cigarettesAvoided } from './stats.js';

const H = 60 * 60 * 1000;
const D = 24 * H;

export const RANK_LADDER = [
  { id: 'rookie', name: 'Rookie', icon: '🌱', tagline: 'Every journey starts here.', smokeFreeMs: 0 },
  { id: 'fighter', name: 'Fighter', icon: '🥊', tagline: 'Six hours smoke-free.', smokeFreeMs: 6 * H },
  { id: 'survivor', name: 'Survivor', icon: '🛡️', tagline: 'First full day.', smokeFreeMs: 1 * D },
  { id: 'warrior', name: 'Warrior', icon: '⚔️', tagline: 'Three days strong.', smokeFreeMs: 3 * D },
  { id: 'guardian', name: 'Guardian', icon: '🏰', tagline: 'One week free.', smokeFreeMs: 7 * D },
  { id: 'champion', name: 'Champion', icon: '🏅', tagline: 'Two weeks.', smokeFreeMs: 14 * D },
  { id: 'veteran', name: 'Veteran', icon: '🎖️', tagline: 'One month.', smokeFreeMs: 30 * D },
  { id: 'elite', name: 'Elite', icon: '💎', tagline: 'Three months.', smokeFreeMs: 90 * D },
  { id: 'master', name: 'Master', icon: '👑', tagline: 'Six months.', smokeFreeMs: 180 * D },
  { id: 'legend', name: 'Legend', icon: '🌟', tagline: 'One year.', smokeFreeMs: 365 * D },
  { id: 'immortal', name: 'Immortal', icon: '🔥', tagline: 'Five years smoke-free.', smokeFreeMs: 5 * 365 * D },
];

export function rankMetrics(state, now = Date.now()) {
  const smokeFreeMs = msSinceQuit(state.profile, now);
  const streakDays = currentStreakDays(state, now);
  return { smokeFreeMs, streakDays };
}

export function currentRankIndex(metrics) {
  let idx = 0;
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (metrics.smokeFreeMs >= RANK_LADDER[i].smokeFreeMs) idx = i;
  }
  return idx;
}

export function getCurrentRank(metrics) {
  return RANK_LADDER[currentRankIndex(metrics)];
}

export function getNextRank(metrics) {
  const idx = currentRankIndex(metrics);
  return idx < RANK_LADDER.length - 1 ? RANK_LADDER[idx + 1] : null;
}

export function progressToNextRank(metrics) {
  const next = getNextRank(metrics);
  if (!next) return 100;
  const current = RANK_LADDER[currentRankIndex(metrics)].smokeFreeMs;
  const span = next.smokeFreeMs - current;
  if (span <= 0) return 100;
  return Math.round(((metrics.smokeFreeMs - current) / span) * 100);
}

export function rankLadderStatus(metrics) {
  const currentIdx = currentRankIndex(metrics);
  return RANK_LADDER.map((rank, i) => ({
    rank,
    unlocked: i <= currentIdx,
    current: i === currentIdx,
  }));
}

export function leaderboardPayload(state, now = Date.now()) {
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const cigs = cigarettesAvoided(state, now);
  const score = Math.floor(metrics.smokeFreeMs / H);
  return {
    displayName: state.profile.displayName || 'Anonymous',
    rankId: rank.id,
    rankName: rank.name,
    rankTier: currentRankIndex(metrics),
    score,
    smokeFreeMs: metrics.smokeFreeMs,
    currentStreakDays: metrics.streakDays,
    cigarettesAvoidedEstimate: cigs,
    quitDate: state.profile.quitDate,
  };
}

export function formatSmokeFreeRequirement(ms) {
  if (ms >= 365 * D) return `${Math.round(ms / (365 * D))} yr smoke-free`;
  if (ms >= D) {
    const days = Math.round(ms / D);
    return `${days} ${days === 1 ? 'day' : 'days'} smoke-free`;
  }
  if (ms >= H) {
    const hrs = Math.round(ms / H);
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} smoke-free`;
  }
  return 'Starting rank';
}

export function nextRankHint(metrics, nextRank) {
  if (!nextRank) return '';
  const remain = nextRank.smokeFreeMs - metrics.smokeFreeMs;
  if (remain <= 0) return '';
  return formatSmokeFreeRequirement(nextRank.smokeFreeMs);
}
