import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, RotateCcw, Trash, Clock, ChevronDown, ChevronRight, Plus, RefreshCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { generateId } from "../utils/uid";

function TaskCard({ t, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, showDueDate = false, density = 'normal' }) {
  const hasSubtasks = Array.isArray(t.subtasks) && t.subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? t.subtasks.filter((st) => st.done).length : 0;
  const totalSubtasks = hasSubtasks ? t.subtasks.length : 0;
  const isDone = t.done || false;
  const dueDate = t.due || t.dateKey || null;
  const createdAt = t.createdAt || new Date().toISOString();
  const priority = t.priority || "medium";
  const title = t.title || "Untitled";
  const notes = t.notes || "";
  const taskId = t.id || generateId();
  const priorityPill =
    priority === "high"
      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      : priority === "low"
      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
  const priorityBorder =
    priority === "high"
      ? "border-red-300 dark:border-red-800/80"
      : priority === "low"
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
  const paddingCls = density === 'minified' ? 'p-1' : density === 'compact' ? 'p-2' : 'p-2 sm:p-3';
  const titleSizeCls = density === 'minified' ? 'text-[13px]' : density === 'compact' ? 'text-[14px]' : '';
  const topGapCls = density === 'minified' ? 'gap-1' : 'gap-2';
  const titleLeftMarginCls = density === 'minified' ? 'ml-0.5' : '';
  const metaMarginTopCls = density === 'minified' ? 'mt-1' : 'mt-2';
  const actionPadCls = density === 'minified' ? 'p-1' : density === 'compact' ? 'p-1.5' : 'p-2';
  const iconSize = density === 'minified' ? 12 : density === 'compact' ? 14 : 16;
  const showNotesPreview = !!notes && density !== 'minified';

  return (
    <motion.div
      key={taskId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${paddingCls} border border-l-4 ${priorityBorder} bg-white dark:bg-slate-900 rounded-lg cursor-grab active:cursor-grabbing`}
      draggable
      onDragStart={(e) => onDragStartTask(e, t)}
      data-tip={`${title}${notes ? "\n" + notes : ""}`}
    >
      <div className={`flex items-start justify-between ${topGapCls}`}>
        <div className={`min-w-0 ${titleLeftMarginCls}`}>
          <div className={`font-medium ${titleSizeCls} ${isDone ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"} truncate`}>{title}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${priorityPill}`}>
            <span className={`${priority === "high" ? "bg-red-600" : priority === "low" ? "bg-green-600" : "bg-amber-600"} w-1.5 h-1.5 rounded-full`} />
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </div>
          {showDueDate && dueDate && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Due on {format(parseISO(dueDate), "EEE, MMM d")}</div>
          )}
        </div>
      </div>
      {showNotesPreview && <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 break-words clamp-2">{notes}</div>}
      <div className={`${metaMarginTopCls} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {hasSubtasks && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              aria-expanded={expanded}
              data-tip={expanded ? "Hide subtasks" : "Show subtasks"}
            >
              {expanded ? <ChevronDown size={iconSize - 0} /> : <ChevronRight size={iconSize - 0} />}
              <span className="tabular-nums">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClickAddSubtask}
          className={`inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline ${density === 'minified' ? 'mr-0.5' : ''}`}
        >
          <Plus size={Math.max(10, iconSize - 2)} /> Subtask
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
                <div key={st.id || generateId()} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!(st.done || false)}
                      onChange={() => onToggleSubtask && onToggleSubtask(t, st.id || generateId())}
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 accent-indigo-600 dark:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className={`text-[12px] truncate ${(st.done || false) ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>{st.title || "Untitled"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask && onDeleteSubtask(t, st.id || generateId())}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
                    data-tip="Delete subtask"
                    aria-label="Delete subtask"
                  >
                    <Trash size={Math.max(12, iconSize - 2)} />
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
      <div className={`${metaMarginTopCls} flex items-center justify-between`}>
        {density !== 'minified' && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <Clock size={Math.max(10, iconSize - 2)} /> {format(parseISO(createdAt), "PP p")}
          </div>
        )}
        <div className="flex gap-1.5 items-center">
          {t.isRecurringInstance && (
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400" data-tip="Recurring">
              <RefreshCcw size={Math.max(10, iconSize - 2)} /> Recurring
            </span>
          )}
          <button onClick={() => onToggleDone(t)} className={`${actionPadCls} rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 ${isDone ? "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" : "text-green-600 dark:text-green-400 border-slate-200 dark:border-slate-700"}`} data-tip={isDone ? "Undo" : "Mark done"} aria-label={isDone ? "Undo" : "Mark done"}>
            {isDone ? <RotateCcw size={iconSize} /> : <Check size={iconSize} />}
          </button>
          <button onClick={() => onOpenEditModal(t)} className={`${actionPadCls} rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400`} data-tip="Edit" aria-label="Edit">
            <Pencil size={iconSize} />
          </button>
          <button onClick={() => onDeleteTask(t)} className={`${actionPadCls} rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400`} data-tip="Delete" aria-label="Delete">
            <Trash size={iconSize} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TaskList({ tasks, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, fullHeight = false, showDueDate = false, density = 'normal' }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-slate-400 dark:text-slate-500">No tasks. Double-click any day to add one quickly.</div>;
  }

  return (
    <div className={fullHeight ? `${density === 'minified' ? 'space-y-1.5' : density === 'compact' ? 'space-y-2' : 'space-y-3'} h-full overflow-auto pr-2` : `${density === 'minified' ? 'space-y-1.5' : density === 'compact' ? 'space-y-2' : 'space-y-3'} max-h-[40vh] sm:max-h-[60vh] overflow-auto pr-2`}>
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
          density={density}
        />
      ))}
    </div>
  );
}


