// Capture the install prompt as early as possible so React can use it later.
(function () {
  try {
    window.__deferredPWAInstallPrompt = null;
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      window.__deferredPWAInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa:beforeinstallprompt"));
    });
    window.addEventListener("appinstalled", function () {
      window.__deferredPWAInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("pwa:appinstalled"));
    });
  } catch (_) {}
})();
