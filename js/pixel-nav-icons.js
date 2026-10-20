/** 16×16 pixel-style nav icons (original, not Nintendo assets). */
const ICONS = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="2" width="2" height="2" fill="#e2e8f0"/><rect x="5" y="4" width="6" height="2" fill="#cbd5e1"/><rect x="3" y="6" width="10" height="2" fill="#94a3b8"/><rect x="5" y="8" width="2" height="6" fill="#64748b"/><rect x="9" y="8" width="2" height="6" fill="#64748b"/><rect x="7" y="10" width="2" height="4" fill="#22c55e"/></svg>`,
  rank: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="3" fill="#fbbf24"/><rect x="5" y="4" width="6" height="2" fill="#f59e0b"/><rect x="4" y="6" width="8" height="2" fill="#eab308"/><rect x="3" y="8" width="10" height="2" fill="#ca8a04"/><rect x="2" y="10" width="12" height="2" fill="#a16207"/><rect x="6" y="12" width="4" height="3" fill="#854d0e"/></svg>`,
  badges: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="2" width="4" height="2" fill="#fbbf24"/><rect x="5" y="4" width="6" height="2" fill="#f59e0b"/><rect x="4" y="6" width="8" height="5" fill="#22c55e"/><rect x="6" y="11" width="4" height="2" fill="#15803d"/><rect x="7" y="13" width="2" height="2" fill="#86efac"/></svg>`,
  more: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="2" width="4" height="2" fill="#94a3b8"/><rect x="4" y="4" width="2" height="2" fill="#cbd5e1"/><rect x="10" y="4" width="2" height="2" fill="#cbd5e1"/><rect x="2" y="6" width="12" height="2" fill="#64748b"/><rect x="4" y="8" width="2" height="2" fill="#cbd5e1"/><rect x="10" y="8" width="2" height="2" fill="#cbd5e1"/><rect x="6" y="10" width="4" height="2" fill="#94a3b8"/><rect x="5" y="12" width="6" height="2" fill="#475569"/></svg>`,
};

export function initPixelNavIcons() {
  document.querySelectorAll('.nav-btn[data-nav]').forEach((btn) => {
    const key = btn.dataset.nav;
    const icon = ICONS[key];
    if (!icon) return;
    let slot = btn.querySelector('.pixel-nav-icon');
    if (!slot) {
      slot = document.createElement('span');
      slot.className = 'pixel-nav-icon';
      btn.insertBefore(slot, btn.firstChild);
    }
    slot.innerHTML = icon;
  });
}
