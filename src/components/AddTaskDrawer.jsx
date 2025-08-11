import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash } from "lucide-react";
import { format } from "date-fns";

export default function AddTaskDrawer({ open, selectedDate, form, setForm, onSubmit, onClose }) {
  const [newSubTitle, setNewSubTitle] = useState("");
  const [addAnother, setAddAnother] = useState(false);
  const inputRef = useRef(null);
  const titleRef = useRef(null);
  const listRef = useRef(null);

  function addSubtaskInline() {
    const title = (newSubTitle || "").trim();
    if (!title) return;
    setForm((f) => ({
      ...f,
      subtasks: [...(Array.isArray(f.subtasks) ? f.subtasks : []), { id: Math.random().toString(36).slice(2, 9), title, done: false }],
    }));
    setNewSubTitle("");
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
      try {
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
          aria-label="Add task panel"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">New Task</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{format(selectedDate, "PPP")}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close add task"
            >
              <X size={18} />
            </button>
          </div>

          <motion.form
            onSubmit={(e) => {
              onSubmit && onSubmit(e, { addAnother });
              if (addAnother) {
                setTimeout(() => {
                  try { titleRef.current && titleRef.current.focus(); } catch {}
                }, 0);
              }
            }}
            className="p-4 flex-1 min-h-0 overflow-auto"
          >
            <div className="grid gap-3">
              <input
                ref={titleRef}
                required
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                className="input"
              />
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="input resize-none"
              />

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
                  <div ref={listRef} className="space-y-1.5 py-1 max-h-40 overflow-auto pr-1">
                    {Array.isArray(form.subtasks) && form.subtasks.map((st, idx) => (
                      <div key={st.id || idx} className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!st.done}
                            onChange={() =>
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
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={addAnother} onChange={(e) => setAddAnother(e.target.checked)} />
                <span>Add another</span>
              </label>
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


