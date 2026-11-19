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
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    reminderRef.current = reminder;
  }, [reminder]);

  const clearSchedulers = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshDueCheck = useCallback(async () => {
    try {
      await maybeFireJournalReminder(reminderRef.current);
    } catch (error) {
      console.warn("Journal reminder due-check failed", error);
    }
  }, []);

  const armLocalSchedulers = useCallback(() => {
    clearSchedulers();
    const current = reminderRef.current;
    if (!current?.enabled) return;

    const next = getNextReminderDate(current.hour, current.minute);
    const delay = Math.max(1000, next.getTime() - Date.now());
    timeoutRef.current = setTimeout(async () => {
      try {
        await maybeFireJournalReminder(reminderRef.current);
      } catch (error) {
        console.warn("Journal reminder fire failed", error);
      } finally {
        armLocalSchedulers();
      }
    }, delay);

    // Backup poll while the page is alive (helps when long timers are throttled).
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") refreshDueCheck();
    }, 30_000);
  }, [clearSchedulers, refreshDueCheck]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      clearSchedulers();
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
      clearSchedulers();
    };
  }, [user?.uid, clearSchedulers]);

  useEffect(() => {
    armLocalSchedulers();
    return clearSchedulers;
  }, [reminder.enabled, reminder.hour, reminder.minute, armLocalSchedulers, clearSchedulers]);

  useEffect(() => {
    if (!reminder.enabled) return undefined;

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refreshDueCheck();
        armLocalSchedulers();
      }
    }

    function onFocus() {
      refreshDueCheck();
      armLocalSchedulers();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [reminder.enabled, refreshDueCheck, armLocalSchedulers]);

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
        return { reminder: safe, permission: null };
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
          armLocalSchedulers();
        } else {
          clearSchedulers();
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
    [user?.uid, armLocalSchedulers, clearSchedulers]
  );

  return {
    reminder,
    loading,
    saving,
    saveReminder,
  };
}
