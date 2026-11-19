import { db, firebase } from "../../firebase";

export const DEFAULT_JOURNAL_REMINDER = {
  enabled: false,
  hour: 18,
  minute: 0,
  timeZone: "UTC",
  pushSubscriptions: [],
  lastNotifiedDateKey: null,
};

function clampHour(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_JOURNAL_REMINDER.hour;
  return Math.max(0, Math.min(23, Math.floor(n)));
}

function clampMinute(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_JOURNAL_REMINDER.minute;
  return Math.max(0, Math.min(59, Math.floor(n)));
}

function sanitizeSubscription(raw) {
  if (!raw?.endpoint || !raw?.keys?.p256dh || !raw?.keys?.auth) return null;
  return {
    endpoint: String(raw.endpoint),
    expirationTime: raw.expirationTime ?? null,
    keys: {
      p256dh: String(raw.keys.p256dh),
      auth: String(raw.keys.auth),
    },
  };
}

export function sanitizeJournalReminder(raw) {
  const subscriptions = Array.isArray(raw?.pushSubscriptions)
    ? raw.pushSubscriptions.map(sanitizeSubscription).filter(Boolean)
    : [];
  const deduped = [];
  const seen = new Set();
  for (const sub of subscriptions) {
    if (seen.has(sub.endpoint)) continue;
    seen.add(sub.endpoint);
    deduped.push(sub);
  }
  return {
    enabled: !!raw?.enabled,
    hour: clampHour(raw?.hour),
    minute: clampMinute(raw?.minute),
    timeZone: typeof raw?.timeZone === "string" && raw.timeZone ? raw.timeZone : "UTC",
    pushSubscriptions: deduped.slice(0, 8),
    lastNotifiedDateKey:
      typeof raw?.lastNotifiedDateKey === "string" && raw.lastNotifiedDateKey
        ? raw.lastNotifiedDateKey
        : null,
  };
}

export function mergePushSubscription(existingSubscriptions, nextSubscription) {
  const safeNext = sanitizeSubscription(nextSubscription);
  const current = Array.isArray(existingSubscriptions) ? existingSubscriptions : [];
  if (!safeNext) return current.map(sanitizeSubscription).filter(Boolean);
  const without = current
    .map(sanitizeSubscription)
    .filter(Boolean)
    .filter((item) => item.endpoint !== safeNext.endpoint);
  return [safeNext, ...without].slice(0, 8);
}

export class JournalReminderRepository {
  constructor(userId) {
    this.userId = userId;
  }

  reminderDocRef() {
    return db.collection("users").doc(this.userId).collection("meta").doc("journalReminder");
  }

  async loadReminder() {
    try {
      const doc = await this.reminderDocRef().get();
      if (!doc.exists) return { ...DEFAULT_JOURNAL_REMINDER };
      return sanitizeJournalReminder(doc.data() || {});
    } catch (error) {
      if (error?.code === "permission-denied" || error?.code === "not-found") {
        return { ...DEFAULT_JOURNAL_REMINDER };
      }
      throw error;
    }
  }

  async saveReminder(reminder) {
    const safe = sanitizeJournalReminder(reminder);
    await this.reminderDocRef().set(
      {
        docType: "journalReminder",
        ownerUid: this.userId,
        enabled: safe.enabled,
        hour: safe.hour,
        minute: safe.minute,
        timeZone: safe.timeZone,
        pushSubscriptions: safe.enabled ? safe.pushSubscriptions : [],
        lastNotifiedDateKey: safe.lastNotifiedDateKey,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return safe;
  }
}

export const createJournalReminderRepository = (userId) => new JournalReminderRepository(userId);
