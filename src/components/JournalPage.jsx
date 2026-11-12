import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { BookOpenText, Calendar, Flame, Loader2, PenSquare } from "lucide-react";
import { countFilledJournalBlocks, extractJournalBlockHeadings, normalizeJournalBlocks } from "../utils/journalTemplates";
import { keyFor } from "../utils/date";

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
}) {
  const [items, setItems] = useState(Array.isArray(journals) ? journals : []);
  const [loading, setLoading] = useState(false);

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

  if (!user) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Sign in to create and view journals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-1">
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Journal</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Build one journal entry per day with optional blocks and fill only what you need.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenJournalEditor && onOpenJournalEditor("__new__", keyFor(new Date()))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <PenSquare size={16} />
            New journal
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpenText size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent journals</h2>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Loading journals...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
            Your journal entries will appear here after you save one.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((entry) => {
              const blocks = normalizeJournalBlocks(entry.blocks, entry.content || "", entry.sections);
              const filledCount = countFilledJournalBlocks(blocks);
              const headings = extractJournalBlockHeadings(blocks);
              return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenJournalEditor && onOpenJournalEditor(entry.id)}
                className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {entry.title || "Journal Entry"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{filledCount} block{filledCount === 1 ? "" : "s"} filled</div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Updated at {formatUpdatedAt(entry.updatedAt)}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 line-clamp-2 whitespace-pre-wrap">
                  {headings.length ? headings.join(" • ") : "No headings"}
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
    </div>
  );
}
