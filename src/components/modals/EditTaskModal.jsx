import React from "react";
import { motion } from "framer-motion";

export default function EditTaskModal({ open, editForm, setEditForm, onSubmit, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.form initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={onSubmit} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 z-50 w-full max-w-lg border border-transparent dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Task</div>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400">
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <input required autoFocus value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" className="input" />
          <textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="input resize-none" />

        <div className="flex items-center gap-2">
          <label className={`px-3 py-1 rounded cursor-pointer ${editForm.priority === "low" ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
            <input type="radio" name="ep" checked={editForm.priority === "low"} onChange={() => setEditForm((f) => ({ ...f, priority: "low" }))} className="hidden" /> Low
          </label>
          <label className={`px-3 py-1 rounded cursor-pointer ${editForm.priority === "medium" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
            <input type="radio" name="ep" checked={editForm.priority === "medium"} onChange={() => setEditForm((f) => ({ ...f, priority: "medium" }))} className="hidden" /> Medium
          </label>
          <label className={`px-3 py-1 rounded cursor-pointer ${editForm.priority === "high" ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
            <input type="radio" name="ep" checked={editForm.priority === "high"} onChange={() => setEditForm((f) => ({ ...f, priority: "high" }))} className="hidden" /> High
          </label>
        </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">
              Save
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}


