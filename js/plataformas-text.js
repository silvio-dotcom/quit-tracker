/** HUD / hero label for smoke-free day count (plain English; no pixel accent). */
export function htmlPixelDias(className = 'ia') {
  void className;
  return 'DAYS';
}

/** Words that should render in Pixelify Sans, not Press Start 2P. */
export function htmlPixelifyWord(word) {
  return `<span class="px-accent-word">${word}</span>`;
}

export function padDaysHud(days) {
  const n = Math.max(0, Math.floor(days));
  return String(n).padStart(3, '0');
}