import { keyFor } from "./date";
import { DEFAULT_JOURNAL_REMINDER, sanitizeJournalReminder } from "../services/repositories/journalReminderRepository";

export const JOURNAL_REMINDER_LAST_KEY = "caldo_v2_journal_reminder_last";
export const JOURNAL_REMINDER_CACHE_KEY = "caldo_v2_journal_reminder_cache";

export function formatReminderTime(hour, minute) {
  const safe = sanitizeJournalReminder({ enabled: true, hour, minute });
  const date = new Date();
  date.setHours(safe.hour, safe.minute, 0, 0);
  try {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    const hh = String(safe.hour).padStart(2, "0");
    const mm = String(safe.minute).padStart(2, "0");
    return `${hh}:${mm}`;
  }
}

export function loadJournalReminderCache() {
  try {
    const raw = localStorage.getItem(JOURNAL_REMINDER_CACHE_KEY);
    if (!raw) return { ...DEFAULT_JOURNAL_REMINDER };
    return sanitizeJournalReminder(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_JOURNAL_REMINDER };
  }
}

export function saveJournalReminderCache(reminder) {
  try {
    localStorage.setItem(JOURNAL_REMINDER_CACHE_KEY, JSON.stringify(sanitizeJournalReminder(reminder)));
  } catch {}
}

export function clearJournalReminderCache() {
  try {
    localStorage.removeItem(JOURNAL_REMINDER_CACHE_KEY);
  } catch {}
}

export function loadLastJournalReminderDateKey() {
  try {
    return localStorage.getItem(JOURNAL_REMINDER_LAST_KEY) || null;
  } catch {
    return null;
  }
}

export function saveLastJournalReminderDateKey(dateKey) {
  try {
    if (dateKey) localStorage.setItem(JOURNAL_REMINDER_LAST_KEY, String(dateKey));
  } catch {}
}

export function getNextReminderDate(hour, minute, from = new Date()) {
  const safe = sanitizeJournalReminder({ enabled: true, hour, minute });
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setHours(safe.hour, safe.minute, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function isReminderDue(reminder, now = new Date()) {
  const safe = sanitizeJournalReminder(reminder);
  if (!safe.enabled) return false;
  const dueToday = new Date(now);
  dueToday.setHours(safe.hour, safe.minute, 0, 0);
  return now.getTime() >= dueToday.getTime();
}

export async function ensureNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission || "denied";
  }
}

export async function showJournalReminderNotification({ onClickMessage } = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const title = "Time to journal";
  const body = "Take a moment to write today's journal entry.";
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  const data = {
    type: "journal-reminder",
    openTab: "journal",
    ...(onClickMessage ? { message: onClickMessage } : {}),
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: "caldo-journal-reminder",
          renotify: true,
          data,
        });
        return true;
      }
    }
  } catch (error) {
    console.warn("Service worker journal reminder failed; falling back", error);
  }

  try {
    const notification = new Notification(title, { body, icon, tag: "caldo-journal-reminder", data });
    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      try {
        notification.close();
      } catch {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("caldo:open-journal"));
      }
    };
    return true;
  } catch (error) {
    console.warn("Journal reminder notification failed", error);
    return false;
  }
}

export async function maybeFireJournalReminder(reminder, { force = false } = {}) {
  const safe = sanitizeJournalReminder(reminder);
  if (!safe.enabled) return false;

  const todayKey = keyFor(new Date());
  const lastKey = loadLastJournalReminderDateKey();
  if (!force && lastKey === todayKey) return false;
  if (!force && !isReminderDue(safe)) return false;

  const shown = await showJournalReminderNotification();
  if (shown) {
    saveLastJournalReminderDateKey(todayKey);
  }
  return shown;
}
