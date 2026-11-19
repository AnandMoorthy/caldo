import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Keyboard,
  HelpCircle,
  Search,
  RefreshCcw,
  Calendar,
  List,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  BookOpenText,
  Sparkles,
  Target,
  Flame,
  Pin,
  Share2,
  Settings,
} from "lucide-react";

export default function HelpPage({ open, onClose, pomodoroEnabled = true }) {
  const [activeTab, setActiveTab] = useState("overview");

  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onClose === "function") {
          onClose();
        }
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const searchShortcut = isMac ? "⌘K" : "Ctrl+K";

  const tabs = [
    { id: "overview", label: "Overview", icon: HelpCircle },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: List },
    ...(pomodoroEnabled ? [{ id: "pomodoro", label: "Pomodoro", icon: Clock }] : []),
    { id: "notes", label: "Notes", icon: FileText },
    { id: "journal", label: "Journal", icon: BookOpenText },
    { id: "moments", label: "Moments", icon: Sparkles },
    { id: "habits", label: "Habits", icon: Target },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "features", label: "Features", icon: Info },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ];

  const ShortcutRow = ({ label, keys }) => (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-1">
        {(Array.isArray(keys) ? keys : [keys]).map((key) => (
          <kbd
            key={key}
            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <HelpCircle size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome to CalDo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          Your personal calendar, tasks, notes, journal, moments, and habits in one place.
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">{searchShortcut}</kbd> to search,
          or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">?</kbd> anytime for this guide.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 mb-3">
            <Calendar size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Tasks & Calendar</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Plan with Day, Week, Month, and Year views, priorities, subtasks, and recurring work
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 mb-3">
            <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Reusable rich-text notes you can pin, copy, and optionally share with a link
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 mb-3">
            <BookOpenText size={20} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Journal</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            One entry per day with mood, energy level, and a daily reminder
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 mb-3">
            <Sparkles size={20} className="text-pink-600 dark:text-pink-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Moments</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Short mood-tagged posts organized by categories
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 mb-3">
            <Target size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Habits</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Track daily habits with a rolling 7-day history
          </p>
        </div>

        {pomodoroEnabled && (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 mb-3">
              <Clock size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Pomodoro</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Focus timer with work/break cycles for today&apos;s tasks
            </p>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
        <p>
          <strong>Day notes vs Notes:</strong> Day notes live on a calendar date (press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-xs">N</kbd> on Tasks).
          The Notes tab is for reusable freeform notes.
        </p>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Calendar</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Switch between Day, Week, Month, and Year. On phones, Tasks stays on Day view.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Month & Year indicators</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-blue-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Blue dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Day note present</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-red-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Red dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Incomplete tasks (past/today)</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-slate-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Gray dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Upcoming tasks (future dates)</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-amber-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Amber dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Mixed completion</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-green-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Green dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">All tasks complete</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Interactive features</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Double-click a day</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Quickly add a task for that date
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Drag & drop</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Reschedule one-off tasks by dragging them to different days
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Note: Recurring tasks cannot be moved
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Keyboard navigation</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Arrow keys move the selected date by one day. Use{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">0</kbd> to jump to today,
                and letter/number shortcuts to switch views.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Week view</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Shows a blue day-note indicator plus done/total counts, with an inline task list for each day
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Management</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Create, organize, and track tasks with priorities, subtasks, and recurrence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Creating tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Plus size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Press T</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Quick task creation for the selected date</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Calendar size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Double-click a day</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Add a task to that date</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <FileText size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Press N</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Open the day note for the selected date</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Clock size={16} className="text-amber-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Press O</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Review missed (overdue incomplete) tasks</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Task features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Priorities & completion</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Low / Medium / High priority, mark done when due</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <List size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Subtasks</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Break work into checklist items inside a task</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <RefreshCcw size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Recurring</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Daily, weekly, or monthly patterns with end rules</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Flame size={16} className="text-orange-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Streaks & density</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Earn a streak by finishing today; tune Day view density</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recurring tasks</h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>Frequency:</strong> Daily, Weekly, or Monthly</p>
          <p><strong>Interval:</strong> Every N days/weeks/months</p>
          <p><strong>Weekly:</strong> Choose specific days of the week</p>
          <p><strong>Monthly:</strong> Select day of the month</p>
          <p><strong>Ends:</strong> Never, on a date, or after occurrences</p>
          <p><strong>Editing:</strong> When you edit or delete a recurring task, choose this occurrence or the whole series</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          Task restrictions
        </h3>
        <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Future tasks</strong> cannot be marked complete until their due date</li>
            <li><strong>Recurring tasks</strong> cannot be moved between dates with drag & drop</li>
            <li>See the <button type="button" onClick={() => setActiveTab("faq")} className="text-amber-700 dark:text-amber-300 underline hover:no-underline">FAQ</button> for details</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPomodoro = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Pomodoro Timer</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Focused work sessions and breaks for today&apos;s tasks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Getting started</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Clock size={16} className="text-orange-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Start timer</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Click the timer on a today task, or press P</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Today only</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Pomodoro is available for today&apos;s tasks</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <RefreshCcw size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Auto-complete</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Tasks can auto-complete when a work session ends</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Timer phases</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Work session</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">25 minutes of focused work (default)</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Short break</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">5 minutes between work sessions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Long break</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">15 minutes after 4 work sessions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Floating widget</h3>
        <div className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
          <p><strong>Draggable:</strong> Move the timer anywhere on your screen</p>
          <p><strong>Persistent:</strong> Position is saved between sessions</p>
          <p><strong>Settings:</strong> Customize durations, sounds, and desktop notifications</p>
        </div>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Notes</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Reusable rich-text notes, separate from per-day calendar notes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Creating notes</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Plus size={16} className="text-indigo-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">New note</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Open the Notes tab and create a note</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <FileText size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Rich text</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Format content with the rich text editor</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Note features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Pin size={16} className="text-indigo-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Pin</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Keep important notes at the top</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Copy size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Copy</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">One-click copy to clipboard</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Share2 size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Share</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Publish a public link, optionally with edit access</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Search size={16} className="text-slate-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Search</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Find notes via global search ({searchShortcut})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Day notes vs Notes tab</h3>
        <div className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
          <p><strong>Day notes:</strong> Tied to a calendar date; open with N or the sticky-note control on Tasks</p>
          <p><strong>Notes tab:</strong> Freeform reusable notes that are not bound to a day</p>
        </div>
      </div>
    </div>
  );

  const renderJournal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Journal</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Keep one journal entry per day with mood, energy, and freeform notes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Getting started</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <BookOpenText size={16} className="text-cyan-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Write daily notes</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Capture reflections, wins, or anything else</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Plus size={16} className="text-indigo-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">New journal</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Open or create the entry for that day</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Clock size={16} className="text-amber-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Daily reminder</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Choose a local time; settings sync, notifications stay on-device</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">What to track</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Info size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Mood</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Capture how you felt each day</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Clock size={16} className="text-emerald-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Energy level</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Track daily energy from 1 to 5</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMoments = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Moments</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Capture short, mood-tagged posts and organize them with categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Creating moments</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Sparkles size={16} className="text-pink-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Short posts</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Write quick thoughts (up to a short character limit)</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Info size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Mood tags</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Optional mood such as happy, calm, motivated, and more</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Organization</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <List size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Categories</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Assign categories and manage them as needed</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Search size={16} className="text-slate-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Searchable</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Moments appear in global search</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHabits = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Habits</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Build consistency by checking off habits each day
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Tracking</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Plus size={16} className="text-emerald-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Add habits</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Create habits like Drink water or Stretch</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Toggle for a day</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Mark complete for today or any day in the 7-day history</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">History</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Target size={16} className="text-indigo-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Last 7 days</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Review and update recent completions at a glance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShortcuts = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Keyboard Shortcuts</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Most task shortcuts work on the Tasks tab. They are paused while typing, and while Notes, Journal, Settings, or a day-note/journal drawer is open.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Global</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ShortcutRow label="Search everything" keys={searchShortcut} />
            <ShortcutRow label="Open Help" keys="?" />
            <ShortcutRow label="Close dialog / drawer" keys="Esc" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Search covers tasks, day notes, Notes, journals, and moments. Inside search: ↑↓ navigate, Enter select, Esc close.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Tasks actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ShortcutRow label="Add new task" keys="T" />
            <ShortcutRow label="Open day notes" keys="N" />
            <ShortcutRow label="Open missed tasks" keys="O" />
            {pomodoroEnabled && <ShortcutRow label="Open Pomodoro timer" keys="P" />}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Views & navigation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ShortcutRow label="Day view" keys={["D", "1"]} />
            <ShortcutRow label="Week view" keys={["W", "2"]} />
            <ShortcutRow label="Month view" keys={["M", "3"]} />
            <ShortcutRow label="Year view" keys={["Y", "4"]} />
            <ShortcutRow label="Previous day" keys="←" />
            <ShortcutRow label="Next day" keys="→" />
            <ShortcutRow label="Jump to today" keys="0" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            On phones, Tasks stays on Day view, so Week/Month/Year letter and number shortcuts are disabled. Hold ← / → to keep stepping days.
          </p>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Features</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Highlights across CalDo&apos;s current toolkit
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Search size={20} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Global search</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Find tasks, day notes, Notes, journals, and moments:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">{searchShortcut}</kbd> to open search</li>
              <li>Use ↑↓ to navigate, Enter to select, Esc to close</li>
              <li>Click a result to jump to that item or date</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={20} className="text-green-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Day notes</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>On Tasks, press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">N</kbd> or use the sticky-note control</li>
              <li>Day notes sync with your account and appear in search</li>
              <li>They are separate from the Notes tab</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={20} className="text-purple-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Missed tasks</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">O</kbd> to review incomplete past tasks</li>
              <li>Reschedule or complete overdue items from one place</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Flame size={20} className="text-orange-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Streaks & density</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Complete all of today&apos;s tasks to grow your streak (header flame)</li>
              <li>In Day view, switch task card density: normal, compact, or minified</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={20} className="text-pink-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Moments & Habits</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Moments:</strong> short mood-tagged posts with categories</li>
              <li><strong>Habits:</strong> daily check-offs with a 7-day history</li>
            </ul>
          </div>
        </div>

        {pomodoroEnabled && (
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={20} className="text-orange-600" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">Pomodoro timer</h3>
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Press <kbd className="px-1.5 py-0.5 rounded bg-orange-200 dark:bg-orange-800 text-xs">P</kbd> to open the timer</li>
                <li>Default 25 / 5 / 15 cycle with customizable durations</li>
                <li>Only available for today&apos;s tasks</li>
              </ul>
            </div>
          </div>
        )}

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Settings size={20} className="text-slate-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Settings & sync</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Appearance:</strong> theme palettes with light and dark modes</li>
              <li><strong>Data:</strong> export a JSON backup of your CalDo content</li>
              <li><strong>Account:</strong> sign in with Google for cloud sync</li>
              <li><strong>Install:</strong> add CalDo as a PWA from the profile menu when available</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={20} className="text-amber-600" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Data integrity</h3>
          </div>
          <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Future tasks cannot be completed early</li>
              <li>Recurring tasks keep their series and cannot be drag-moved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Frequently Asked Questions</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Answers to common questions about CalDo&apos;s behavior
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
            <AlertCircle size={20} />
            Why can&apos;t I mark future tasks as complete?
          </h3>
          <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
            <p>Tasks due in the future stay incomplete until their date arrives, so progress tracking stays accurate.</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
            <RefreshCcw size={20} />
            Why can&apos;t I drag and drop recurring tasks?
          </h3>
          <div className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
            <p>Moving a recurring occurrence would break the series pattern. Edit the series (or a single occurrence) instead of dragging.</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Info size={20} />
            What is the difference between day notes and Notes?
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p><strong>Day notes</strong> belong to a calendar date (shortcut N). <strong>Notes</strong> are reusable freeform documents in the Notes tab.</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Why don&apos;t shortcuts work sometimes?</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Shortcuts pause while you type in an input, and while Notes, Journal, Settings, or a day-note/journal drawer is open. Esc and {searchShortcut} still work.</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
            <CheckCircle size={20} />
            What can I still do with restricted tasks?
          </h3>
          <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Edit title, notes, priority, and subtasks</li>
              <li>Delete (choose occurrence or series for recurring)</li>
              <li>Complete future tasks once their due date arrives</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "calendar":
        return renderCalendar();
      case "tasks":
        return renderTasks();
      case "pomodoro":
        return renderPomodoro();
      case "notes":
        return renderNotes();
      case "journal":
        return renderJournal();
      case "moments":
        return renderMoments();
      case "habits":
        return renderHabits();
      case "shortcuts":
        return renderShortcuts();
      case "features":
        return renderFeatures();
      case "faq":
        return renderFAQ();
      default:
        return renderOverview();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-white/95 dark:bg-slate-900/95 backdrop-blur"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <HelpCircle size={18} />
              <span className="font-semibold">CalDo — Help & Guide</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
              aria-label="Close help"
              data-tip="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row h-full pt-16">
            <div className="sm:hidden border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex gap-1 overflow-x-auto px-3 py-2 safe-pb">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium touch-manipulation ${
                        activeTab === tab.id
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden sm:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <nav className="p-4">
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="max-w-4xl mx-auto p-4 sm:p-6 content-pb sm:pb-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
