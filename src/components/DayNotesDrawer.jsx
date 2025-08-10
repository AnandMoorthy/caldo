import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function DayNotesDrawer({ open, dateLabel = "", value = "", onChange, onSave, onClose, saving = false, justSaved = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 h-full z-[70] w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
          aria-label="Day notes panel"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Notes for</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{dateLabel}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close notes"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 flex-1 min-h-0 overflow-hidden">
            <textarea
              rows={14}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder="Write anything about your day..."
              className="input w-full h-full resize-none"
            />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
              Close
            </button>
            <motion.button
              type="button"
              onClick={onSave}
              className={`px-4 py-2 rounded text-white inline-flex items-center gap-2 ${saving ? 'bg-indigo-500' : 'bg-indigo-600'}`}
              animate={saving ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1] } : justSaved ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.6, type: 'spring', stiffness: 250, damping: 20 }}
              disabled={saving}
            >
              {saving ? 'Saving…' : justSaved ? 'Saved' : 'Save'}
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


