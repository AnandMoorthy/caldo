import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, HelpCircle } from "lucide-react";

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
              title="Close (Esc)"
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
                  <span>Close dialog/drawer</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">Esc</kbd>
                </div>
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


