import { isNativePlatform } from './platform.js';

const INSTALLED_KEY = 'quit-tracker-installed';

let deferredPrompt = null;

export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
}

export function isIosSafari() {
  const ua = window.navigator.userAgent || '';
  const ios = /iphone|ipad|ipod/i.test(ua);
  return ios && !window.MSStream;
}

function $(sel) {
  return document.querySelector(sel);
}

function $$(sel) {
  return [...document.querySelectorAll(sel)];
}

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', hidden);
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, '1');
  } catch {
    /* ignore */
  }
}

function wasInstalledBefore() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

function hideAllInstallUi() {
  setHidden($('#btn-install-header'), true);
  document.querySelectorAll('[data-install-ui]').forEach((el) => el.classList.add('hidden'));
  $('#modal-ios-install')?.classList.remove('open');
}

export function updateInstallUi() {
  if (isNativePlatform()) {
    hideAllInstallUi();
    return;
  }
  const standalone = isStandalonePwa();
  const showProminent = !standalone && !wasInstalledBefore();

  setHidden($('#btn-install-header'), !showProminent);

  const moreBtn = $('#btn-install-more');
  if (moreBtn) {
    moreBtn.disabled = standalone;
    moreBtn.textContent = standalone ? 'Installed on home screen' : 'Add to Home Screen';
  }
}

function openIosInstallSheet() {
  $('#modal-ios-install')?.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeIosInstallSheet() {
  $('#modal-ios-install')?.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
}

async function onInstallTap() {
  if (isNativePlatform()) return;
  if (isStandalonePwa()) return;

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === 'accepted') {
      markInstalled();
      updateInstallUi();
    }
    return;
  }

  if (isIosSafari()) {
    openIosInstallSheet();
    return;
  }

  const toast = window.__QT_TOAST__;
  if (toast) toast('Use your browser menu (⋮ or Share) to install this app.');
}

export function initInstallUi() {
  if (isNativePlatform()) {
    updateInstallUi();
    return;
  }
  if (isStandalonePwa()) {
    updateInstallUi();
    return;
  }

  updateInstallUi();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallUi();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    markInstalled();
    updateInstallUi();
  });

  $('#btn-install-header')?.addEventListener('click', onInstallTap);
  $('#btn-install-more')?.addEventListener('click', onInstallTap);
  $$('[data-close="modal-ios-install"]').forEach((btn) => {
    btn.addEventListener('click', closeIosInstallSheet);
  });
}
