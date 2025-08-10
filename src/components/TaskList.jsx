import React from "react";
import { motion } from "framer-motion";
import { Pencil, Check, RotateCcw, Trash, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TaskList({ tasks, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-slate-400 dark:text-slate-500">No tasks. Double-click any day to add one quickly.</div>;
  }

  return (
    <div className="space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-auto pr-2">
      {tasks.map((t) => {
        const priorityPill =
          t.priority === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : t.priority === "low" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
        const priorityBorder =
          t.priority === "high"
            ? "border-red-300 dark:border-red-800/80"
            : t.priority === "low"
            ? "border-green-300 dark:border-green-800/80"
            : "border-amber-300 dark:border-amber-800/80";
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
              <div className={`font-medium ${t.done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"} truncate min-w-0`}>{t.title}</div>
              <div className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${priorityPill}`}>
                <span className={`${t.priority === "high" ? "bg-red-600" : t.priority === "low" ? "bg-green-600" : "bg-amber-600"} w-1.5 h-1.5 rounded-full`} />
                {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
              </div>
            </div>
            {t.notes && <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 break-words clamp-2">{t.notes}</div>}
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
      })}
    </div>
  );
}


