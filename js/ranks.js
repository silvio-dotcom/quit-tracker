/**
 * Personal rank ladder (NoPuff-style accountability ranks, solo for now).
 * Requirements are data-driven so a future API can compare `leaderboardPayload()` across users.
 */

import { msSinceQuit, currentStreakDays, longestStreakDays, cravingsResistedCount } from './stats.js';

const H = 60 * 60 * 1000;
const D = 24 * H;

/**
 * @typedef {Object} RankRequirements
 * @property {number} smokeFreeMs
 * @property {number} cravingsResisted
 * @property {number} streakDays
 */

/**
 * @typedef {Object} RankTier
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} tagline
 * @property {RankRequirements} requirements
 */

/** Ordered lowest → highest. First tier is starting rank. */
export const RANK_LADDER = [
  {
    id: 'rookie',
    name: 'Rookie',
    icon: '🌱',
    tagline: 'Every journey starts here.',
    requirements: { smokeFreeMs: 0, cravingsResisted: 0, streakDays: 0 },
  },
  {
    id: 'fighter',
    name: 'Fighter',
    icon: '🥊',
    tagline: 'You showed up when it got hard.',
    requirements: { smokeFreeMs: 6 * H, cravingsResisted: 1, streakDays: 0 },
  },
  {
    id: 'survivor',
    name: 'Survivor',
    icon: '🛡️',
    tagline: 'First full day in the books.',
    requirements: { smokeFreeMs: 1 * D, cravingsResisted: 2, streakDays: 1 },
  },
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    tagline: 'Three days — the peak is passing.',
    requirements: { smokeFreeMs: 3 * D, cravingsResisted: 5, streakDays: 3 },
  },
  {
    id: 'guardian',
    name: 'Guardian',
    icon: '🏰',
    tagline: 'A week of protecting your lungs.',
    requirements: { smokeFreeMs: 7 * D, cravingsResisted: 8, streakDays: 7 },
  },
  {
    id: 'champion',
    name: 'Champion',
    icon: '🏅',
    tagline: 'Two weeks smoke-free.',
    requirements: { smokeFreeMs: 14 * D, cravingsResisted: 12, streakDays: 14 },
  },
  {
    id: 'veteran',
    name: 'Veteran',
    icon: '🎖️',
    tagline: 'A month of discipline.',
    requirements: { smokeFreeMs: 30 * D, cravingsResisted: 20, streakDays: 30 },
  },
  {
    id: 'elite',
    name: 'Elite',
    icon: '💎',
    tagline: 'Quarter-year ex-smoker.',
    requirements: { smokeFreeMs: 90 * D, cravingsResisted: 35, streakDays: 60 },
  },
  {
    id: 'master',
    name: 'Master',
    icon: '👑',
    tagline: 'Half a year of freedom.',
    requirements: { smokeFreeMs: 180 * D, cravingsResisted: 50, streakDays: 90 },
  },
  {
    id: 'legend',
    name: 'Legend',
    icon: '🌟',
    tagline: 'One year — you rewrote the story.',
    requirements: { smokeFreeMs: 365 * D, cravingsResisted: 75, streakDays: 180 },
  },
  {
    id: 'immortal',
    name: 'Immortal',
    icon: '🔥',
    tagline: 'Top of the personal ladder.',
    requirements: { smokeFreeMs: 5 * 365 * D, cravingsResisted: 150, streakDays: 365 },
  },
];

export function rankMetrics(state, now = Date.now()) {
  const smokeFreeMs = msSinceQuit(state.profile, now);
  const resisted = cravingsResistedCount(state);
  const streakDays = currentStreakDays(state, now);
  const bestStreakDays = Math.max(
    state.personalBestStreak || 0,
    longestStreakDays(state),
    streakDays
  );
  return { smokeFreeMs, cravingsResisted: resisted, streakDays, bestStreakDays };
}

export function meetsRequirements(metrics, requirements) {
  return (
    metrics.smokeFreeMs >= requirements.smokeFreeMs &&
    metrics.cravingsResisted >= requirements.cravingsResisted &&
    metrics.streakDays >= requirements.streakDays
  );
}

export function currentRankIndex(metrics) {
  let idx = 0;
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (meetsRequirements(metrics, RANK_LADDER[i].requirements)) idx = i;
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

function reqProgress(metrics, requirements) {
  const parts = [
    requirements.smokeFreeMs
      ? metrics.smokeFreeMs / requirements.smokeFreeMs
      : 1,
    requirements.cravingsResisted
      ? metrics.cravingsResisted / requirements.cravingsResisted
      : 1,
    requirements.streakDays ? metrics.streakDays / requirements.streakDays : 1,
  ];
  return Math.min(1, Math.min(...parts));
}

/** Progress toward the next rank (0–100). Uses bottleneck requirement. */
export function progressToNextRank(metrics) {
  const next = getNextRank(metrics);
  if (!next) return 100;
  return Math.round(reqProgress(metrics, next.requirements) * 100);
}

export function rankLadderStatus(metrics) {
  const currentIdx = currentRankIndex(metrics);
  return RANK_LADDER.map((rank, i) => ({
    rank,
    unlocked: i <= currentIdx,
    current: i === currentIdx,
  }));
}

/** Payload shape for a future online leaderboard API. */
export function leaderboardPayload(state, now = Date.now()) {
  const metrics = rankMetrics(state, now);
  const rank = getCurrentRank(metrics);
  const score =
    Math.floor(metrics.smokeFreeMs / H) +
    metrics.cravingsResisted * 25 +
    metrics.streakDays * 40 +
    metrics.bestStreakDays * 10;
  return {
    displayName: state.profile.displayName || 'Anonymous',
    rankId: rank.id,
    rankName: rank.name,
    rankTier: currentRankIndex(metrics),
    score,
    smokeFreeMs: metrics.smokeFreeMs,
    cravingsResisted: metrics.cravingsResisted,
    currentStreakDays: metrics.streakDays,
    bestStreakDays: metrics.bestStreakDays,
    quitDate: state.profile.quitDate,
  };
}

export function formatRankRequirement(key, value) {
  if (key === 'smokeFreeMs') {
    if (value >= 365 * D) return `${Math.round(value / (365 * D))} yr smoke-free`;
    if (value >= D) return `${Math.round(value / D)} days smoke-free`;
    if (value >= H) return `${Math.round(value / H)} hrs smoke-free`;
    return 'Start your quit';
  }
  if (key === 'cravingsResisted') return `${value} craving${value === 1 ? '' : 's'} resisted`;
  if (key === 'streakDays') return `${value}-day clean streak`;
  return String(value);
}

export function nextRankHints(metrics, nextRank) {
  if (!nextRank) return [];
  const r = nextRank.requirements;
  const hints = [];
  if (metrics.smokeFreeMs < r.smokeFreeMs) {
    hints.push(formatRankRequirement('smokeFreeMs', r.smokeFreeMs));
  }
  if (metrics.cravingsResisted < r.cravingsResisted) {
    hints.push(formatRankRequirement('cravingsResisted', r.cravingsResisted));
  }
  if (metrics.streakDays < r.streakDays) {
    hints.push(formatRankRequirement('streakDays', r.streakDays));
  }
  return hints;
}
