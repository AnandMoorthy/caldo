import { useCallback, useEffect, useRef, useState } from "react";
import {
  createJournalReminderRepository,
  DEFAULT_JOURNAL_REMINDER,
  mergePushSubscription,
  sanitizeJournalReminder,
} from "../services/repositories/journalReminderRepository";
import {
  clearJournalReminderCache,
  ensureNotificationPermission,
  loadJournalReminderCache,
  maybeFireJournalReminder,
  postReminderScheduleToServiceWorker,
  saveJournalReminderCache,
} from "../utils/journalReminder";
import { detectTimeZone, ensureServiceWorkerRegistration, subscribeJournalPush } from "../utils/webPush";

export function useJournalReminder(user) {
  const [reminder, setReminder] = useState(() =>
    user ? loadJournalReminderCache() : { ...DEFAULT_JOURNAL_REMINDER }
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const repoRef = useRef(null);
  const reminderRef = useRef(reminder);
  const intervalRef = useRef(null);

  useEffect(() => {
    reminderRef.current = reminder;
  }, [reminder]);

  const clearPoll = useCallback(() => {
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

  const armLocalPolling = useCallback(() => {
    clearPoll();
    const current = reminderRef.current;
    if (!current?.enabled) {
      postReminderScheduleToServiceWorker({ ...DEFAULT_JOURNAL_REMINDER, enabled: false });
      return;
    }

    postReminderScheduleToServiceWorker(current);
    // Short interval survives background throttling better than a multi-hour setTimeout.
    intervalRef.current = setInterval(() => {
      refreshDueCheck();
    }, 30_000);
    refreshDueCheck();
  }, [clearPoll, refreshDueCheck]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      clearPoll();
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
      clearPoll();
    };
  }, [user?.uid, clearPoll]);

  useEffect(() => {
    armLocalPolling();
    return clearPoll;
  }, [reminder.enabled, reminder.hour, reminder.minute, armLocalPolling, clearPoll]);

  useEffect(() => {
    if (!reminder.enabled) return undefined;

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refreshDueCheck();
        armLocalPolling();
      } else {
        postReminderScheduleToServiceWorker(reminderRef.current);
      }
    }

    function onFocus() {
      refreshDueCheck();
      armLocalPolling();
    }

    function onPageHide() {
      postReminderScheduleToServiceWorker(reminderRef.current);
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [reminder.enabled, refreshDueCheck, armLocalPolling]);

  useEffect(() => {
    function onSwMessage(event) {
      const data = event?.data;
      if (data?.type === "OPEN_JOURNAL" || data?.openTab === "journal") {
        window.dispatchEvent(new CustomEvent("caldo:open-journal"));
      }
      if (data?.type === "JOURNAL_REMINDER_FIRED" && data?.dateKey) {
        try {
          localStorage.setItem("caldo_v2_journal_reminder_last", String(data.dateKey));
        } catch {}
      }
    }
    if (!("serviceWorker" in navigator)) return undefined;
    navigator.serviceWorker.addEventListener("message", onSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onSwMessage);
  }, []);

  const saveReminder = useCallback(
    async (nextReminder) => {
      const safe = sanitizeJournalReminder({
        ...reminderRef.current,
        ...nextReminder,
        timeZone: detectTimeZone(),
      });
      if (!user?.uid || !repoRef.current) {
        setReminder(safe);
        saveJournalReminderCache(safe);
        return { reminder: safe, permission: null };
      }

      setSaving(true);
      try {
        let permission = null;
        let pushSubscriptions = safe.pushSubscriptions;

        if (safe.enabled) {
          permission = await ensureNotificationPermission();
          if (permission === "denied") {
            const denied = { ...safe, enabled: false, pushSubscriptions: [] };
            setReminder(denied);
            saveJournalReminderCache(denied);
            await repoRef.current.saveReminder(denied);
            return { reminder: denied, permission };
          }

          await ensureServiceWorkerRegistration();
          const pushResult = await subscribeJournalPush();
          if (pushResult.ok) {
            pushSubscriptions = mergePushSubscription(pushSubscriptions, pushResult.subscription);
          } else if (pushResult.reason === "missing-vapid" || pushResult.reason === "unsupported") {
            // Still allow enabling; local/foreground polling remains as fallback.
          } else if (pushResult.reason === "subscribe-failed" || pushResult.reason === "no-service-worker") {
            // Keep enabled; background delivery may be limited until SW/push works.
            console.warn("Journal reminder push subscribe incomplete:", pushResult.reason);
          }
        } else {
          pushSubscriptions = [];
        }

        const toSave = {
          ...safe,
          pushSubscriptions: safe.enabled ? pushSubscriptions : [],
        };
        const saved = await repoRef.current.saveReminder(toSave);
        setReminder(saved);
        saveJournalReminderCache(saved);
        if (saved.enabled) {
          armLocalPolling();
        } else {
          clearPoll();
          postReminderScheduleToServiceWorker(saved);
        }
        return {
          reminder: saved,
          permission:
            permission ||
            (safe.enabled && typeof Notification !== "undefined" ? Notification.permission : null),
          pushReady: Array.isArray(saved.pushSubscriptions) && saved.pushSubscriptions.length > 0,
        };
      } finally {
        setSaving(false);
      }
    },
    [user?.uid, armLocalPolling, clearPoll]
  );

  return {
    reminder,
    loading,
    saving,
    saveReminder,
  };
}
