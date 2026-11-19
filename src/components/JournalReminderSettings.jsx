import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Loader2, X } from "lucide-react";
import { formatReminderTime } from "../utils/journalReminder";
import { sanitizeJournalReminder } from "../services/repositories/journalReminderRepository";

function toTimeInputValue(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseTimeInputValue(value) {
  const [h, m] = String(value || "18:00").split(":");
  return sanitizeJournalReminder({ enabled: true, hour: h, minute: m });
}

export default function JournalReminderSettings({
  open,
  onClose,
  reminder,
  loading = false,
  saving = false,
  onSave,
}) {
  const [enabled, setEnabled] = useState(!!reminder?.enabled);
  const [timeValue, setTimeValue] = useState(() =>
    toTimeInputValue(reminder?.hour ?? 18, reminder?.minute ?? 0)
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEnabled(!!reminder?.enabled);
    setTimeValue(toTimeInputValue(reminder?.hour ?? 18, reminder?.minute ?? 0));
    setError("");
  }, [open, reminder]);

  async function handleSave() {
    setError("");
    const parsed = parseTimeInputValue(timeValue);
    const next = {
      enabled,
      hour: parsed.hour,
      minute: parsed.minute,
    };

    try {
      const result = await onSave?.(next);
      if (enabled && result?.permission === "denied") {
        setEnabled(false);
        setError("Notification permission is required to enable journal reminders. Allow notifications in your browser settings, then try again.");
        return;
      }
      onClose?.();
    } catch (err) {
      console.error("Failed to save journal reminder", err);
      setError("Could not save reminder. Please try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose?.()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Journal reminder settings"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 inline-flex items-center justify-center">
                  {enabled ? <Bell size={18} /> : <BellOff size={18} />}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Journal reminder</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Get a local notification each day at your chosen time. Settings sync with your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !saving && onClose?.()}
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close reminder settings"
              >
                <X size={16} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Loading reminder...
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Daily reminder</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Remind me to write in my journal
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => setEnabled((v) => !v)}
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="journal-reminder-time">
                    Time
                  </label>
                  <input
                    id="journal-reminder-time"
                    type="time"
                    value={timeValue}
                    disabled={!enabled}
                    onChange={(e) => setTimeValue(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Uses this device&apos;s local time
                    {enabled
                      ? ` · ${formatReminderTime(
                          parseTimeInputValue(timeValue).hour,
                          parseTimeInputValue(timeValue).minute
                        )}`
                      : ""}
                    . Notifications are local to this device and fire while Caldo is open (or right after you return to it).
                  </p>
                </div>

                {error ? (
                  <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
                    {error}
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !saving && onClose?.()}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                Save reminder
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
