import { useCallback, useEffect, useRef, useState } from "react";
import {
  createJournalReminderRepository,
  DEFAULT_JOURNAL_REMINDER,
  sanitizeJournalReminder,
} from "../services/repositories/journalReminderRepository";
import {
  clearJournalReminderCache,
  ensureNotificationPermission,
  getNextReminderDate,
  loadJournalReminderCache,
  maybeFireJournalReminder,
  saveJournalReminderCache,
} from "../utils/journalReminder";

export function useJournalReminder(user) {
  const [reminder, setReminder] = useState(() =>
    user ? loadJournalReminderCache() : { ...DEFAULT_JOURNAL_REMINDER }
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const repoRef = useRef(null);
  const reminderRef = useRef(reminder);
  const timerRef = useRef(null);

  useEffect(() => {
    reminderRef.current = reminder;
  }, [reminder]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    const current = reminderRef.current;
    if (!current?.enabled) return;

    const next = getNextReminderDate(current.hour, current.minute);
    const delay = Math.max(1000, next.getTime() - Date.now());
    timerRef.current = setTimeout(async () => {
      try {
        await maybeFireJournalReminder(reminderRef.current);
      } catch (error) {
        console.warn("Journal reminder fire failed", error);
      } finally {
        scheduleNext();
      }
    }, delay);
  }, [clearTimer]);

  const refreshDueCheck = useCallback(async () => {
    try {
      await maybeFireJournalReminder(reminderRef.current);
    } catch (error) {
      console.warn("Journal reminder due-check failed", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      clearTimer();
      if (!user?.uid) {
        repoRef.current = null;
        clearJournalReminderCache();
        if (mounted) setReminder({ ...DEFAULT_JOURNAL_REMINDER });
        return;
      }

      repoRef.current = createJournalReminderRepository(user.uid);
      setLoading(true);
      try {
        const cached = loadJournalReminderCache();
        if (mounted) setReminder(cached);
        const cloud = await repoRef.current.loadReminder();
        if (!mounted) return;
        setReminder(cloud);
        saveJournalReminderCache(cloud);
      } catch (error) {
        console.error("Failed to load journal reminder", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      clearTimer();
    };
  }, [user?.uid, clearTimer]);

  useEffect(() => {
    scheduleNext();
    return clearTimer;
  }, [reminder.enabled, reminder.hour, reminder.minute, scheduleNext, clearTimer]);

  useEffect(() => {
    if (!reminder.enabled) return undefined;

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refreshDueCheck();
        scheduleNext();
      }
    }

    function onFocus() {
      refreshDueCheck();
      scheduleNext();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") refreshDueCheck();
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      clearInterval(intervalId);
    };
  }, [reminder.enabled, refreshDueCheck, scheduleNext]);

  useEffect(() => {
    function onSwMessage(event) {
      const data = event?.data;
      if (data?.type === "OPEN_JOURNAL" || data?.openTab === "journal") {
        window.dispatchEvent(new CustomEvent("caldo:open-journal"));
      }
    }
    if (!("serviceWorker" in navigator)) return undefined;
    navigator.serviceWorker.addEventListener("message", onSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onSwMessage);
  }, []);

  const saveReminder = useCallback(
    async (nextReminder) => {
      const safe = sanitizeJournalReminder(nextReminder);
      if (!user?.uid || !repoRef.current) {
        setReminder(safe);
        saveJournalReminderCache(safe);
        return safe;
      }

      setSaving(true);
      try {
        let permission = null;
        if (safe.enabled) {
          permission = await ensureNotificationPermission();
          if (permission === "denied") {
            const denied = { ...safe, enabled: false };
            setReminder(denied);
            saveJournalReminderCache(denied);
            await repoRef.current.saveReminder(denied);
            return { reminder: denied, permission };
          }
        }

        const saved = await repoRef.current.saveReminder(safe);
        setReminder(saved);
        saveJournalReminderCache(saved);
        if (saved.enabled) {
          scheduleNext();
        } else {
          clearTimer();
        }
        return {
          reminder: saved,
          permission:
            permission ||
            (safe.enabled && typeof Notification !== "undefined" ? Notification.permission : null),
        };
      } finally {
        setSaving(false);
      }
    },
    [user?.uid, scheduleNext, clearTimer]
  );

  return {
    reminder,
    loading,
    saving,
    saveReminder,
  };
}
