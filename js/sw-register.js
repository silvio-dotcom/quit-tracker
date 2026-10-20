/**
 * Runs before app modules so clients with a broken cached bundle can still upgrade.
 */
(function registerQuitTrackerServiceWorker() {
  var V = window.__QT_BUILD__ || '1';
  if (!('serviceWorker' in navigator)) return;

  var swUrl = 'sw.js?v=' + encodeURIComponent(V);
  var scope = new URL('./', window.location.href).href;
  var reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  function wireRegistration(reg) {
    if (!reg || !reg.update) return reg;
    reg.update();
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    reg.addEventListener('updatefound', function () {
      var worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', function () {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
    return reg;
  }

  function registerFresh() {
    return navigator.serviceWorker.register(swUrl, { scope: scope, updateViaCache: 'none' }).then(wireRegistration);
  }

  navigator.serviceWorker.getRegistrations()
    .then(function (regs) {
      var stale = regs.filter(function (r) {
        var url = (r.active && r.active.scriptURL) || (r.installing && r.installing.scriptURL) || '';
        return url.indexOf('sw.js?v=' + V) === -1;
      });
      return Promise.all(stale.map(function (r) { return r.unregister(); }));
    })
    .then(registerFresh)
    .catch(function () {
      return registerFresh();
    });
})();
