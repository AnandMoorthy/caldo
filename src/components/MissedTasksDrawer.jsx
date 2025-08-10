import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import TaskList from "./TaskList.jsx";

export default function MissedTasksDrawer({
  open,
  count = 0,
  tasks = [],
  onClose,
  onDragStartTask,
  onToggleDone,
  onOpenEditModal,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 h-full z-[70] w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
          aria-label="Missed tasks panel"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Incomplete this month</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {count} task{count === 1 ? "" : "s"}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close missed tasks"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-4 py-2 text-[12px] text-slate-500 dark:text-slate-400">
            Drag a task onto a day to reschedule. Click the check to mark done.
          </div>

          <div className="p-4 flex-1 min-h-0 overflow-hidden">
            <TaskList
              tasks={tasks}
              onDragStartTask={onDragStartTask}
              onToggleDone={onToggleDone}
              onOpenEditModal={onOpenEditModal}
              onDeleteTask={onDeleteTask}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              fullHeight
              showDueDate
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


