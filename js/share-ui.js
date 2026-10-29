import { prepareShareContent, shareProgressPayload, copyShareText } from './share-card.js';

let pending = null;

function $(sel) {
  return document.querySelector(sel);
}

function openModal() {
  $('#modal-share-preview')?.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal() {
  $('#modal-share-preview')?.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
  if (pending?.url) URL.revokeObjectURL(pending.url);
  pending = null;
}

/**
 * @param {object} state
 * @param {(msg: string) => void} toast
 */
export async function openSharePreview(state, toast) {
  const { text, render } = prepareShareContent(state);
  const blob = await render();
  const url = URL.createObjectURL(blob);
  pending = { text, blob, url, state };

  const img = $('#share-preview-image');
  const pre = $('#share-preview-text');
  if (img) {
    img.src = url;
    img.alt = 'Vista previa para compartir';
  }
  if (pre) pre.textContent = text;
  openModal();
}

/**
 * @param {() => object} getState
 * @param {(msg: string) => void} toast
 */
export function bindSharePreviewUi(getState, toast) {
  $('#btn-share-preview-close')?.addEventListener('click', closeModal);
  $$('[data-close="modal-share-preview"]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
  $('#btn-share-preview-copy')?.addEventListener('click', async () => {
    if (!pending?.text) return;
    const ok = await copyShareText(pending.text);
    toast(ok ? 'Texto copiado' : 'No se pudo copiar el texto');
  });
  $('#btn-share-preview-share')?.addEventListener('click', async () => {
    if (!pending) return;
    try {
      const mode = await shareProgressPayload(pending.state || getState(), pending.text, pending.blob);
      if (mode === 'shared') toast('¡Compartido!');
      else if (mode === 'copy-download') toast('Texto copiado — imagen descargada');
      else if (mode === 'cancelled') return;
      else toast('Imagen descargada');
      closeModal();
    } catch {
      toast('No se pudo compartir');
    }
  });
}

function $$(sel) {
  return [...document.querySelectorAll(sel)];
}
