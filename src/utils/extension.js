export function isChromeExtensionPage() {
  try {
    return globalThis.location?.protocol === "chrome-extension:";
  } catch {
    return false;
  }
}
