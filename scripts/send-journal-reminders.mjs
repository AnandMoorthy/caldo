/**
 * Sends due journal reminder Web Push notifications.
 *
 * Required env:
 * - FIREBASE_SERVICE_ACCOUNT: JSON string of a Firebase service account
 * - WEB_PUSH_VAPID_PRIVATE_KEY: VAPID private key
 * Optional:
 * - WEB_PUSH_VAPID_PUBLIC_KEY
 * - WEB_PUSH_SUBJECT (mailto:...)
 * - FIREBASE_PROJECT_ID
 */
import admin from "firebase-admin";
import webpush from "web-push";

const WINDOW_MINUTES = 20;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name}`);
  return value;
}

function parseServiceAccount() {
  const raw = requiredEnv("FIREBASE_SERVICE_ACCOUNT");
  const parsed = JSON.parse(raw);
  if (parsed.private_key && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

function getZonedParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function isDueNow(reminder, now = new Date()) {
  if (!reminder?.enabled) return false;
  const local = getZonedParts(now, reminder.timeZone || "UTC");
  if (reminder.lastNotifiedDateKey && reminder.lastNotifiedDateKey === local.dateKey) {
    return false;
  }
  const dueMinutes = Number(reminder.hour) * 60 + Number(reminder.minute);
  const nowMinutes = local.hour * 60 + local.minute;
  const diff = nowMinutes - dueMinutes;
  return diff >= 0 && diff < WINDOW_MINUTES;
}

function buildPayload() {
  return JSON.stringify({
    title: "Time to journal",
    body: "Take a moment to write today's journal entry.",
    data: { type: "journal-reminder", openTab: "journal" },
  });
}

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.WEB_PUSH_VAPID_PRIVATE_KEY) {
    console.log(
      JSON.stringify({
        ok: true,
        skipped: true,
        reason: "Missing FIREBASE_SERVICE_ACCOUNT or WEB_PUSH_VAPID_PRIVATE_KEY secret",
      })
    );
    return;
  }

  const serviceAccount = parseServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  const publicKey =
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY ||
    "BMsJLbL9Ydew3uV9Zs-debZdnJSM-hDMGzVr3Si3UMr5PQtxQW9XR_DgA0WDbxDUxLKQi5M8Wv9xMHPTGGu8QM4";
  const privateKey = requiredEnv("WEB_PUSH_VAPID_PRIVATE_KEY");
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:caldo@anandhere.xyz";

  webpush.setVapidDetails(subject, publicKey, privateKey);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  }
  const db = admin.firestore();

  const snap = await db
    .collectionGroup("meta")
    .where("docType", "==", "journalReminder")
    .where("enabled", "==", true)
    .get();

  const now = new Date();
  const payload = buildPayload();
  let checked = 0;
  let due = 0;
  let sent = 0;
  let failed = 0;

  for (const doc of snap.docs) {
    checked += 1;
    const data = doc.data() || {};
    if (!isDueNow(data, now)) continue;
    due += 1;

    const local = getZonedParts(now, data.timeZone || "UTC");
    const subscriptions = Array.isArray(data.pushSubscriptions) ? data.pushSubscriptions : [];
    if (!subscriptions.length) {
      console.log(`due but no subscriptions: ${doc.ref.path}`);
      continue;
    }

    const kept = [];
    for (const sub of subscriptions) {
      if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) continue;
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload,
          { TTL: 60 * 60 }
        );
        sent += 1;
        kept.push(sub);
      } catch (error) {
        failed += 1;
        const status = error?.statusCode || error?.status;
        // Drop gone/expired subscriptions.
        if (status === 404 || status === 410) {
          console.warn(`dropping expired subscription for ${doc.ref.path}`);
          continue;
        }
        console.error(`push failed for ${doc.ref.path}:`, error?.message || error);
        kept.push(sub);
      }
    }

    await doc.ref.set(
      {
        lastNotifiedDateKey: local.dateKey,
        pushSubscriptions: kept,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  console.log(
    JSON.stringify({
      ok: true,
      checked,
      due,
      sent,
      failed,
      at: now.toISOString(),
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
