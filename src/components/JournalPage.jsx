import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Bell, Calendar, Flame, Loader2, Plus } from "lucide-react";
import PageSectionHeader from "./PageSectionHeader.jsx";
import { keyFor } from "../utils/date";
import { formatReminderTime } from "../utils/journalReminder";
import JournalReminderSettings from "./JournalReminderSettings.jsx";

function formatJournalDate(dateKey) {
  try {
    return format(parseISO(dateKey), "EEE, MMM d, yyyy");
  } catch {
    return dateKey;
  }
}

function formatUpdatedAt(updatedAt) {
  try {
    const date = updatedAt?.toDate?.() || updatedAt;
    return format(new Date(date), "MMM d, h:mm a");
  } catch {
    return "Just now";
  }
}

const ENERGY_LABELS = {
  1: "Very low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Very high",
};

const MOOD_LABELS = {
  happy: "Happy",
  calm: "Calm",
  grateful: "Grateful",
  tired: "Tired",
  anxious: "Anxious",
  frustrated: "Frustrated",
};

export default function JournalPage({
  repo,
  user,
  journals = [],
  onOpenJournalEditor,
  onJournalsChanged,
  reminder,
  reminderLoading = false,
  reminderSaving = false,
  onSaveReminder,
}) {
  const [items, setItems] = useState(Array.isArray(journals) ? journals : []);
  const [loading, setLoading] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  useEffect(() => {
    setItems(Array.isArray(journals) ? journals : []);
  }, [journals]);

  useEffect(() => {
    if (!repo || !user) return;
    let mounted = true;
    async function loadJournals() {
      setLoading(true);
      try {
        const fetched = await repo.listJournals({ limit: 300 });
        if (!mounted) return;
        setItems(fetched);
        onJournalsChanged && onJournalsChanged(fetched);
      } catch (error) {
        console.error("Failed to load journals", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadJournals();
    return () => {
      mounted = false;
    };
  }, [repo, user]);

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
        <PageSectionHeader
          eyebrow={items.length === 1 ? "1 entry" : `${items.length} entries`}
          title="Journal"
          actions={
            <>
              <button
                type="button"
                onClick={() => setReminderOpen(true)}
                disabled={!user}
                className="inline-flex items-center justify-center gap-1 h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 touch-manipulation"
                title={
                  reminder?.enabled
                    ? `Daily reminder at ${formatReminderTime(reminder.hour, reminder.minute)}`
                    : "Set journal reminder"
                }
              >
                <Bell size={14} className={reminder?.enabled ? "text-indigo-600 dark:text-indigo-300" : ""} />
                <span className="hidden sm:inline">
                  {reminder?.enabled
                    ? formatReminderTime(reminder.hour, reminder.minute)
                    : "Reminder"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenJournalEditor && onOpenJournalEditor("__new__", keyFor(new Date()))}
                disabled={!user}
                className="shrink-0 inline-flex items-center justify-center gap-1 h-9 px-3 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 touch-manipulation"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>New</span>
              </button>
            </>
          }
        />

        <JournalReminderSettings
          open={reminderOpen}
          onClose={() => setReminderOpen(false)}
          reminder={reminder}
          loading={reminderLoading}
          saving={reminderSaving}
          onSave={onSaveReminder}
        />

        {!user ? (
          <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
            Sign in to create and view journals.
          </div>
        ) : loading ? (
          <div className="p-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Loading journals...
          </div>
        ) : items.length === 0 ? (
          <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
            Your journal entries will appear here after you save one.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((entry) => {
              const preview = String(entry.content || "").trim();
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onOpenJournalEditor && onOpenJournalEditor(entry.id)}
                  className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {entry.title || "Journal Entry"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Updated at {formatUpdatedAt(entry.updatedAt)}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 line-clamp-2 whitespace-pre-wrap">
                    {preview || "No notes yet"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Calendar size={12} />
                      {formatJournalDate(entry.dateKey)}
                    </span>
                    {entry.mood ? (
                      <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        {MOOD_LABELS[entry.mood] || entry.mood}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      <Flame size={12} />
                      {ENERGY_LABELS[Math.max(1, Math.min(5, Number(entry.energyLevel) || 3))]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
