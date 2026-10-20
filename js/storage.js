import { STORAGE_KEY, defaultState } from './constants.js';

export function normalizeState(parsed) {
  const base = defaultState();
  if (!parsed || typeof parsed !== 'object') return base;
  return {
    ...base,
    ...parsed,
    profile: { ...base.profile, ...(parsed.profile || {}) },
    seenAchievements: Array.isArray(parsed.seenAchievements) ? parsed.seenAchievements : [],
    seenRanks: Array.isArray(parsed.seenRanks) ? parsed.seenRanks : [],
    personalBestStreak: Number(parsed.personalBestStreak) || 0,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJson(file) {
  return file.text().then((text) => {
    const merged = normalizeState(JSON.parse(text));
    saveState(merged);
    return merged;
  });
}

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
