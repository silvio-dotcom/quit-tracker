import { renderPixelCoin } from './chip-art.js';
import { chipHealthFact } from './chip-health-unlocks.js';

/**
 * @param {{ id: string, label: string }} tier
 * @param {() => void} onClose
 * @param {'en'|'es'} [locale]
 */
export function showChipHealthUnlockModal(tier, onClose, locale = 'en') {
  const modal = document.querySelector('#modal-chip-health');
  const artEl = document.querySelector('#chip-health-art');
  const titleEl = document.querySelector('#chip-health-title');
  const factEl = document.querySelector('#chip-health-fact');
  const btn = document.querySelector('[data-close="modal-chip-health"]');
  if (!modal || !btn || !tier) {
    onClose?.();
    return;
  }

  if (artEl) {
    artEl.innerHTML = renderPixelCoin(tier, { size: 88, mode: 'earned', idleSpin: true });
    artEl.classList.add('chip-health-art-pop');
    window.setTimeout(() => artEl.classList.remove('chip-health-art-pop'), 700);
  }
  if (titleEl) titleEl.textContent = tier.label;
  if (factEl) factEl.textContent = chipHealthFact(tier.id, locale) || '';

  modal.classList.add('open');
  document.body.classList.add('modal-open');

  const done = () => {
    btn.removeEventListener('click', done);
    modal.classList.remove('open');
    if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
    onClose?.();
  };
  btn.addEventListener('click', done);
}
