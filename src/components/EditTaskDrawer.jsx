import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash } from "lucide-react";

export default function EditTaskDrawer({ open, editForm, setEditForm, onSubmit, onClose }) {
  const [newSubTitle, setNewSubTitle] = useState("");
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [subsOpen, setSubsOpen] = useState(() => Array.isArray(editForm?.subtasks) && editForm.subtasks.length > 0);

  useEffect(() => {
    try {
      if (Array.isArray(editForm?.subtasks) && editForm.subtasks.length > 0) setSubsOpen(true);
    } catch {}
  }, [editForm?.subtasks?.length]);
  function addSubtaskInline() {
    const title = (newSubTitle || "").trim();
    if (!title) return;
    setEditForm((f) => ({
      ...f,
      subtasks: [...(Array.isArray(f.subtasks) ? f.subtasks : []), { id: Math.random().toString(36).slice(2, 9), title, done: false }],
    }));
    setNewSubTitle("");
    setSubsOpen(true);
    setTimeout(() => {
      try {
        if (inputRef.current) inputRef.current.focus();
        if (listRef.current) listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      } catch {}
    }, 0);
  }
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 h-full z-[70] w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
          aria-label="Edit task panel"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Task</div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close edit task"
            >
              <X size={18} />
            </button>
          </div>

          <motion.form onSubmit={onSubmit} className="p-4 flex-1 min-h-0 overflow-auto">
            <div className="grid gap-3">
              <label className="text-sm text-slate-600 dark:text-slate-300">Title</label>
              <input
                required
                autoFocus
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                className="input"
              />
              <label className="text-sm text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="input resize-none"
              />

              <label className="text-sm text-slate-600 dark:text-slate-300">Priority</label>
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

              <details className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3" open={subsOpen} onToggle={(e) => setSubsOpen(e.currentTarget.open)}>
                <summary className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">Subtasks</summary>
                <div className="mt-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700/60 rounded-md">
                  <div ref={listRef} className="space-y-1.5 py-1 max-h-40 overflow-auto pr-1">
                    {Array.isArray(editForm.subtasks) && editForm.subtasks.map((st, idx) => (
                      <div key={st.id || idx} className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!st.done}
                            onChange={() =>
                              setEditForm((f) => {
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
                              setEditForm((f) => {
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
                            setEditForm((f) => ({
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
                    <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 pt-2 pb-1 pr-1">
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

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">
                  Save
                </button>
              </div>
            </div>
          </motion.form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


