import { db, firebase } from "../../firebase";

export const DEFAULT_JOURNAL_REMINDER = {
  enabled: false,
  hour: 18,
  minute: 0,
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

export function sanitizeJournalReminder(raw) {
  return {
    enabled: !!raw?.enabled,
    hour: clampHour(raw?.hour),
    minute: clampMinute(raw?.minute),
  };
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
        ownerUid: this.userId,
        enabled: safe.enabled,
        hour: safe.hour,
        minute: safe.minute,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return safe;
  }
}

export const createJournalReminderRepository = (userId) => new JournalReminderRepository(userId);
