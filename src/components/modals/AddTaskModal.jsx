import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AddTaskModal({ open, selectedDate, form, setForm, onSubmit, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.form initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={onSubmit} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 z-50 w-full max-w-lg border border-transparent dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Task — {format(selectedDate, "PPP")}</div>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400">
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <input required autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" className="input" />
          <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="input resize-none" />

          <div className="flex items-center gap-2">
            <label className={`px-3 py-1 rounded cursor-pointer ${form.priority === "low" ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
              <input type="radio" name="p" checked={form.priority === "low"} onChange={() => setForm((f) => ({ ...f, priority: "low" }))} className="hidden" /> Low
            </label>
            <label className={`px-3 py-1 rounded cursor-pointer ${form.priority === "medium" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
              <input type="radio" name="p" checked={form.priority === "medium"} onChange={() => setForm((f) => ({ ...f, priority: "medium" }))} className="hidden" /> Medium
            </label>
            <label className={`px-3 py-1 rounded cursor-pointer ${form.priority === "high" ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
              <input type="radio" name="p" checked={form.priority === "high"} onChange={() => setForm((f) => ({ ...f, priority: "high" }))} className="hidden" /> High
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">
              Add
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}


