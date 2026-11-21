import { auth, firebase } from "../firebase";
import { isChromeExtensionPage } from "./extension";

export { isChromeExtensionPage };

export function signInWithGoogleInExtension() {
  const identity = globalThis.chrome?.identity;
  if (!identity?.getAuthToken) {
    return Promise.reject(new Error("Chrome sign-in is unavailable."));
  }

  return new Promise((resolve, reject) => {
    identity.getAuthToken({ interactive: true }, async (accessToken) => {
      const message = globalThis.chrome.runtime?.lastError?.message;
      if (message) {
        reject(new Error(message));
        return;
      }
      if (!accessToken) {
        reject(new Error("Google did not return an access token."));
        return;
      }
      try {
        const credential = firebase.auth.GoogleAuthProvider.credential(null, accessToken);
        await auth.signInWithCredential(credential);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function clearExtensionGoogleToken() {
  if (!isChromeExtensionPage()) return;
  const identity = globalThis.chrome?.identity;
  if (typeof identity?.clearAllCachedAuthTokens !== "function") return;
  try {
    identity.clearAllCachedAuthTokens(() => {});
  } catch {}
}
