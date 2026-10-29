/** Pixel accent for Press Start 2P — Í reads as lowercase i without this. */
export function htmlPixelDias(className = 'ia') {
  return `D<span class="${className}" aria-hidden="false">I</span>AS`;
}

/** Words with Ó/Á that should render in Pixelify Sans, not P2. */
export function htmlPixelifyWord(word) {
  return `<span class="px-accent-word">${word}</span>`;
}

export function padDaysHud(days) {
  const n = Math.max(0, Math.floor(days));
  return String(n).padStart(3, '0');
}
