import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, RotateCcw, Trash, Clock, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

function TaskCard({ t, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, showDueDate = false }) {
  const hasSubtasks = Array.isArray(t.subtasks) && t.subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? t.subtasks.filter((st) => st.done).length : 0;
  const totalSubtasks = hasSubtasks ? t.subtasks.length : 0;
  const priorityPill =
    t.priority === "high"
      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      : t.priority === "low"
      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
  const priorityBorder =
    t.priority === "high"
      ? "border-red-300 dark:border-red-800/80"
      : t.priority === "low"
      ? "border-green-300 dark:border-green-800/80"
      : "border-amber-300 dark:border-amber-800/80";
  const [expanded, setExpanded] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState("");
  const inputRef = useRef(null);
  function onClickAddSubtask() {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
      }
      return next;
    });
  }
  function submitNewSubtask() {
    const title = (newSubTitle || "").trim();
    if (!title) return;
    onAddSubtask && onAddSubtask(t, title);
    setNewSubTitle("");
  }
  return (
    <motion.div
      key={t.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden p-2 sm:p-3 border border-l-4 ${priorityBorder} bg-white dark:bg-slate-900 rounded-lg cursor-grab active:cursor-grabbing`}
      draggable
      onDragStart={(e) => onDragStartTask(e, t)}
      title={`${t.title}${t.notes ? "\n" + t.notes : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-medium ${t.done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"} truncate`}>{t.title}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${priorityPill}`}>
            <span className={`${t.priority === "high" ? "bg-red-600" : t.priority === "low" ? "bg-green-600" : "bg-amber-600"} w-1.5 h-1.5 rounded-full`} />
            {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
          </div>
          {showDueDate && t.due && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Due on {format(parseISO(t.due), "EEE, MMM d")}</div>
          )}
        </div>
      </div>
      {t.notes && <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 break-words clamp-2">{t.notes}</div>}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasSubtasks && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              aria-expanded={expanded}
              title={expanded ? "Hide subtasks" : "Show subtasks"}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="tabular-nums">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClickAddSubtask}
          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Plus size={12} /> Subtask
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700/60 rounded-md"
          >
            <div className="space-y-1.5 py-1">
              {hasSubtasks && t.subtasks.map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!st.done}
                      onChange={() => onToggleSubtask && onToggleSubtask(t, st.id)}
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 accent-indigo-600 dark:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className={`text-[12px] truncate ${st.done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>{st.title}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask && onDeleteSubtask(t, st.id)}
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
                    if (e.key === 'Enter') { e.preventDefault(); submitNewSubtask(); }
                    if (e.key === 'Escape') { setNewSubTitle(""); setExpanded(false); }
                  }}
                  placeholder="Add a subtask"
                  className="input h-8 text-[12px] py-1"
                />
                <button
                  type="button"
                  onClick={submitNewSubtask}
                  className="px-2 py-1 rounded bg-indigo-600 text-white text-[12px]"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
          <Clock size={12} /> {format(parseISO(t.createdAt), "PP p")}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onToggleDone(t)} className={`p-2 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 ${t.done ? "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" : "text-green-600 dark:text-green-400 border-slate-200 dark:border-slate-700"}`} title={t.done ? "Undo" : "Mark done"} aria-label={t.done ? "Undo" : "Mark done"}>
            {t.done ? <RotateCcw size={16} /> : <Check size={16} />}
          </button>
          <button onClick={() => onOpenEditModal(t)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400" title="Edit" aria-label="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => onDeleteTask(t)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400" title="Delete" aria-label="Delete">
            <Trash size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TaskList({ tasks, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, fullHeight = false, showDueDate = false }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-slate-400 dark:text-slate-500">No tasks. Double-click any day to add one quickly.</div>;
  }

  return (
    <div className={fullHeight ? "space-y-3 h-full overflow-auto pr-2" : "space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-auto pr-2"}>
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          t={t}
          onDragStartTask={onDragStartTask}
          onToggleDone={onToggleDone}
          onOpenEditModal={onOpenEditModal}
          onDeleteTask={onDeleteTask}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          showDueDate={showDueDate}
        />
      ))}
    </div>
  );
}


