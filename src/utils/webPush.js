import { webPushConfig } from "../config";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function subscriptionToJson(subscription) {
  if (!subscription) return null;
  const json = subscription.toJSON ? subscription.toJSON() : null;
  if (!json?.endpoint || !json?.keys?.p256dh || !json?.keys?.auth) return null;
  return {
    endpoint: String(json.endpoint),
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: String(json.keys.p256dh),
      auth: String(json.keys.auth),
    },
  };
}

export async function ensureServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const base = import.meta.env.BASE_URL || "/";
  try {
    const existing = await navigator.serviceWorker.getRegistration(base);
    if (existing) return existing;
    return await navigator.serviceWorker.register(`${base}sw.js`);
  } catch (error) {
    console.warn("Service worker registration failed", error);
    return null;
  }
}

export async function subscribeJournalPush() {
  if (!webPushConfig?.vapidPublicKey) {
    return { ok: false, reason: "missing-vapid" };
  }
  if (!("Notification" in window) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "permission" };
  }

  const registration = await ensureServiceWorkerRegistration();
  if (!registration?.pushManager) {
    return { ok: false, reason: "no-service-worker" };
  }

  try {
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(webPushConfig.vapidPublicKey),
      });
    }
    const payload = subscriptionToJson(subscription);
    if (!payload) return { ok: false, reason: "invalid-subscription" };
    return { ok: true, subscription: payload };
  } catch (error) {
    console.warn("Web Push subscribe failed", error);
    return { ok: false, reason: "subscribe-failed", error };
  }
}

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
