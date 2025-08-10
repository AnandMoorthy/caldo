import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash } from "lucide-react";
import { format } from "date-fns";

export default function AddTaskModal({ open, selectedDate, form, setForm, onSubmit, onClose }) {
  if (!open) return null;
  const [newSubTitle, setNewSubTitle] = useState("");
  const inputRef = useRef(null);

  function addSubtaskInline() {
    const title = (newSubTitle || "").trim();
    if (!title) return;
    setForm((f) => ({
      ...f,
      subtasks: [...(Array.isArray(f.subtasks) ? f.subtasks : []), { id: Math.random().toString(36).slice(2, 9), title, done: false }],
    }));
    setNewSubTitle("");
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  }

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

          <details className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3">
            <summary className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">Subtasks (optional)</summary>
            <div className="mt-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700/60 rounded-md">
              <div className="space-y-1.5 py-1 max-h-40 overflow-auto pr-1">
                {Array.isArray(form.subtasks) && form.subtasks.map((st, idx) => (
                  <div key={st.id || idx} className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!st.done}
                        onChange={(e) =>
                          setForm((f) => {
                            const next = Array.isArray(f.subtasks) ? [...f.subtasks] : [];
                            next[idx] = { ...next[idx], done: !next[idx].done };
                            return { ...f, subtasks: next };
                          })
                        }
                        className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 accent-indigo-600 dark:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        value={st.title}
                        onChange={(e) =>
                          setForm((f) => {
                            const next = Array.isArray(f.subtasks) ? [...f.subtasks] : [];
                            next[idx] = { ...next[idx], title: e.target.value };
                            return { ...f, subtasks: next };
                          })
                        }
                        placeholder="Subtask title"
                        className="input h-8 text-[12px] py-1"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          subtasks: (Array.isArray(f.subtasks) ? f.subtasks : []).filter((_, i) => i !== idx),
                        }))
                      }
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
                      title="Delete subtask"
                      aria-label="Delete subtask"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    ref={inputRef}
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addSubtaskInline(); }
                      if (e.key === 'Escape') { setNewSubTitle(""); }
                    }}
                    placeholder="Add a subtask"
                    className="input h-8 text-[12px] py-1"
                  />
                  <button
                    type="button"
                    onClick={addSubtaskInline}
                    className="px-2 py-1 rounded bg-indigo-600 text-white text-[12px] inline-flex items-center gap-1"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>
          </details>

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


