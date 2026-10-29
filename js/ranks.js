/**
 * Personal rank ladder — smoke-free time only (capped at 1 year).
 */

import { msSinceQuit, currentStreakDays, cigarettesAvoided } from './stats.js';

const H = 60 * 60 * 1000;
const D = 24 * H;
const Y = 365 * D;

export const RANK_LADDER = [
  { id: 'rookie', name: 'Novato', icon: '🌱', tagline: 'Todo camino empieza aquí.', smokeFreeMs: 0 },
  { id: 'fighter', name: 'Luchador', icon: '🥊', tagline: 'Seis horas sin fumar.', smokeFreeMs: 6 * H },
  { id: 'survivor', name: 'Superviviente', icon: '🛡️', tagline: 'Tu primer día completo.', smokeFreeMs: 1 * D },
  { id: 'warrior', name: 'Guerrero', icon: '⚔️', tagline: 'Tres días firmes.', smokeFreeMs: 3 * D },
  { id: 'guardian', name: 'Guardián', icon: '🏰', tagline: 'Una semana libre.', smokeFreeMs: 7 * D },
  { id: 'champion', name: 'Campeón', icon: '🏅', tagline: 'Dos semanas.', smokeFreeMs: 14 * D },
  { id: 'veteran', name: 'Veterano', icon: '🎖️', tagline: 'Un mes.', smokeFreeMs: 30 * D },
  { id: 'elite', name: 'Élite', icon: '💎', tagline: 'Dos meses.', smokeFreeMs: 60 * D },
  { id: 'master', name: 'Maestro', icon: '👑', tagline: 'Seis meses.', smokeFreeMs: 180 * D },
  { id: 'legend', name: 'Leyenda', icon: '🌟', tagline: 'Un año entero sin fumar.', smokeFreeMs: Y },
];

export const MAX_RANK_MS = Y;

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
  return Math.min(100, Math.max(0, Math.round(((metrics.smokeFreeMs - current) / span) * 100)));
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
    displayName: state.profile.displayName || 'Anónimo',
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
  if (ms >= Y) return '1 año sin fumar';
  if (ms >= D) {
    const days = Math.round(ms / D);
    return `${days} ${days === 1 ? 'día' : 'días'} sin fumar`;
  }
  if (ms >= H) {
    const hrs = Math.round(ms / H);
    return `${hrs} ${hrs === 1 ? 'hora' : 'horas'} sin fumar`;
  }
  return 'Rango inicial';
}

export function nextRankHint(metrics, nextRank) {
  if (!nextRank) return '';
  const remain = nextRank.smokeFreeMs - metrics.smokeFreeMs;
  if (remain <= 0) return '';
  return formatSmokeFreeRequirement(nextRank.smokeFreeMs);
}
