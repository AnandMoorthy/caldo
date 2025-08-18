import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, HelpCircle, Search, RefreshCcw } from "lucide-react";

export default function HelpPage({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-white/95 dark:bg-slate-900/95 backdrop-blur"
        >
          <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <HelpCircle size={18} />
              <span className="font-semibold">CalDo — Help & Shortcuts</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close help"
              data-tip="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-w-3xl mx-auto mt-16 p-4 sm:p-6">
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Indicators</h2>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  <span><strong>Blue dot</strong>: Notes present for that day</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                  <span><strong>Red dot</strong>: Incomplete tasks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                  <span><strong>Amber dot</strong>: Mixed completion</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span><strong>Green dot</strong>: All tasks complete</span>
                </li>
              </ul>
            </section>
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 inline-flex items-center gap-2">
                <Keyboard size={18} /> Keyboard Shortcuts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Add new task</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">T</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Open notes</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">N</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Open missed tasks</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">M</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Toggle density menu</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">D</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Search tasks & notes</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘K' : 'Ctrl+K'}
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Go to previous month</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">←</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Go to next month</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">→</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Jump to today</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">0</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span>Close dialog/drawer</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">Esc</kbd>
                </div>
                
              </div>
            </section>
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 inline-flex items-center gap-2">
                <Search size={18} /> Search
              </h2>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Quickly find tasks and notes across all your data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">⌘K</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">Ctrl+K</kbd> to open search</li>
                  <li>Search by task title, notes, or subtasks</li>
                  <li>Use arrow keys to navigate results, Enter to select</li>
                  <li>Click any result to jump to that date and item</li>
                </ul>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 inline-flex items-center gap-2">
                <RefreshCcw size={18} /> Recurring tasks
              </h2>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Create repeating tasks from the Add Task drawer using <strong>Repeat (optional)</strong>:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Frequency</strong>: choose Daily, Weekly, or Monthly.</li>
                  <li><strong>Interval</strong>: repeat every <em>N</em> days/weeks/months (e.g., every 2 weeks).</li>
                  <li><strong>Weekly</strong>: pick the days of the week the task should occur.</li>
                  <li><strong>Monthly</strong>: select the day of the month.</li>
                  <li><strong>Ends</strong>: Never, on a specific date, or after a number of occurrences.</li>
                </ul>
              </div>
            </section>
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Tips</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <li>Double-click a day to quickly add a task.</li>
                <li>Drag a task onto another day to reschedule.</li>
                <li>Use the Missed panel to review incomplete tasks from earlier days this month.</li>
              </ul>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


