import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, RotateCcw, Trash, Clock, ChevronDown, ChevronRight, Plus, RefreshCcw, Timer } from "lucide-react";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { generateId } from "../utils/uid";
import { formatRecurrenceInfo, getRecurrenceIcon } from "../utils/recurrence";

function TaskCard({ t, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, onStartPomodoro, showDueDate = false, density = 'normal', recurringSeries = [], pomodoroRunningState = { isRunning: false, currentTask: null, timeLeft: null, phase: null, totalTime: null }, hidePriorityLabel = false, hideSubtaskButton = false }) {
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

  const isFutureTask = dueDate && isAfter(parseISO(dueDate), startOfDay(new Date()));

  const isPomodoroRunning = pomodoroRunningState.isRunning &&
    pomodoroRunningState.currentTask &&
    (pomodoroRunningState.currentTask.id === t.id ||
     (pomodoroRunningState.currentTask.parentTask && pomodoroRunningState.currentTask.parentTask.id === t.id));

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!isPomodoroRunning || !pomodoroRunningState.totalTime || !pomodoroRunningState.timeLeft) return 0;
    return ((pomodoroRunningState.totalTime - pomodoroRunningState.timeLeft) / pomodoroRunningState.totalTime) * 100;
  };

  const priorityDot =
    priority === "high" ? "bg-red-500" : priority === "low" ? "bg-emerald-500" : "bg-amber-500";
  const priorityPill =
    priority === "high"
      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      : priority === "low"
      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
  const priorityBorder =
    priority === "high"
      ? "border-red-400 dark:border-red-700"
      : priority === "low"
      ? "border-emerald-400 dark:border-emerald-700"
      : "border-amber-400 dark:border-amber-700";

  const [expanded, setExpanded] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState("");
  const inputRef = useRef(null);

  const series = t.isRecurringInstance && t.seriesId ? recurringSeries.find(s => s.id === t.seriesId) : null;
  const recurrenceInfo = series ? formatRecurrenceInfo(series) : null;
  const recurrenceIcon = series ? getRecurrenceIcon(series) : null;

  function onClickAddSubtask() {
    setExpanded((prev) => {
      const next = !prev;
      if (next) setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
      return next;
    });
  }
  function submitNewSubtask() {
    const nextTitle = (newSubTitle || "").trim();
    if (!nextTitle) return;
    onAddSubtask && onAddSubtask(t, nextTitle);
    setNewSubTitle("");
  }

  const isMinified = density === 'minified';
  const isCompact = density === 'compact';
  const cardPad = isMinified
    ? 'px-2 py-1.5 sm:p-1.5 sm:pr-2'
    : isCompact
    ? 'px-2.5 py-2 sm:p-2 sm:pr-3'
    : 'px-2.5 py-2 sm:p-3 sm:pr-4';
  const titleCls = isMinified ? 'text-[13px]' : 'text-[14px] sm:text-[15px]';
  const showNotesPreview = !!notes && !isMinified;
  const iconSize = 15;
  const actionBtn = `inline-flex items-center justify-center h-8 w-8 rounded-md touch-manipulation active:scale-95 transition-colors`;

  return (
    <motion.div
      key={taskId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${cardPad} border border-l-[3px] ${priorityBorder} bg-white dark:bg-slate-900 rounded-xl sm:rounded-lg ${t.isRecurringInstance ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      draggable={!t.isRecurringInstance}
      onDragStart={(e) => !t.isRecurringInstance && onDragStartTask(e, t)}
      data-tip={`${title}${notes ? "\n" + notes : ""}${isPomodoroRunning ? `\n🍅 Pomodoro in progress - ${formatTime(pomodoroRunningState.timeLeft)}` : ""}`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          onClick={() => onToggleDone(t)}
          disabled={isFutureTask}
          className="-ml-1 mt-0.5 shrink-0 inline-flex items-center justify-center h-8 w-8 touch-manipulation"
          data-tip={isDone ? "Undo" : isFutureTask ? "Cannot mark future tasks complete" : "Mark done"}
          aria-label={isDone ? "Undo" : isFutureTask ? "Cannot mark future tasks complete" : "Mark done"}
        >
          <span
            className={`inline-flex items-center justify-center h-[18px] w-[18px] rounded-[5px] border-2 transition-colors ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : isFutureTask
                ? 'border-slate-200 dark:border-slate-700 text-transparent opacity-50'
                : 'border-slate-300 dark:border-slate-600 text-transparent'
            }`}
          >
            {isDone && <Check size={11} strokeWidth={3} />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`min-w-0 flex-1 font-medium leading-snug ${titleCls} ${isDone ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"} flex items-center gap-1.5`}>
              {t.isRecurringInstance && (
                <span className="inline-flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0" data-tip={`${recurrenceInfo || "Recurring Task"} - Cannot be moved`}>
                  {recurrenceIcon || <RefreshCcw size={12} />}
                </span>
              )}
              <span className="truncate">{title}</span>
            </div>
            {!hidePriorityLabel && (
              <span
                className={`shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-semibold ${priorityPill}`}
                title={priority}
              >
                <span className={`${priorityDot} w-1.5 h-1.5 rounded-full`} />
                <span className="uppercase sm:normal-case">
                  {priority.charAt(0)}
                  <span className="hidden sm:inline">{priority.slice(1)}</span>
                </span>
              </span>
            )}
          </div>

          {t.isRecurringInstance && recurrenceInfo && !isMinified && (
            <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 truncate">
              {recurrenceInfo}
            </div>
          )}

          {showDueDate && dueDate && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Due {format(parseISO(dueDate), "EEE, MMM d")}</div>
          )}

          {isPomodoroRunning && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                <span className="capitalize">{pomodoroRunningState.phase === 'work' ? 'Focus' : pomodoroRunningState.phase === 'shortBreak' ? 'Short Break' : 'Long Break'}</span>
                <span className="font-mono">{formatTime(pomodoroRunningState.timeLeft)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full ${
                    pomodoroRunningState.phase === 'work' ? 'bg-red-500' :
                    pomodoroRunningState.phase === 'shortBreak' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {showNotesPreview && (
            <div className="text-[12px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 break-words clamp-2 leading-snug">{notes}</div>
          )}

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-1.5 pl-3 border-l-2 border-slate-200 dark:border-slate-700/60 rounded-md"
              >
                <div className="space-y-1 py-1">
                  {hasSubtasks && t.subtasks.map((st) => {
                    const isSubtaskPomodoroRunning = pomodoroRunningState.isRunning &&
                      pomodoroRunningState.currentTask &&
                      pomodoroRunningState.currentTask.id === st.id;

                    return (
                      <div key={st.id || generateId()} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={!!(st.done || false)}
                              onChange={() => onToggleSubtask && onToggleSubtask(t, st.id || generateId())}
                              className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 accent-indigo-600 dark:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className={`text-[12px] truncate ${(st.done || false) ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>{st.title || "Untitled"}</span>
                          </label>
                          <div className="flex items-center">
                            {onStartPomodoro && !st.done && (
                              <button
                                type="button"
                                onClick={() => onStartPomodoro({ ...st, parentTask: t })}
                                disabled={isFutureTask}
                                className={`${actionBtn} ${
                                  isFutureTask
                                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                                    : 'hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                                }`}
                                data-tip={isFutureTask ? "Pomodoro only available for today's tasks" : "Start Pomodoro for subtask"}
                                aria-label={isFutureTask ? "Pomodoro only available for today's tasks" : "Start Pomodoro for subtask"}
                              >
                                <Timer size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteSubtask && onDeleteSubtask(t, st.id || generateId())}
                              className={`${actionBtn} hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400`}
                              data-tip="Delete subtask"
                              aria-label="Delete subtask"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                        {isSubtaskPomodoroRunning && (
                          <div className="ml-6">
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                              <span className="capitalize">{pomodoroRunningState.phase === 'work' ? 'Focus' : pomodoroRunningState.phase === 'shortBreak' ? 'Short Break' : 'Long Break'}</span>
                              <span className="font-mono">{formatTime(pomodoroRunningState.timeLeft)}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <motion.div
                                className={`h-1.5 rounded-full ${
                                  pomodoroRunningState.phase === 'work' ? 'bg-red-500' :
                                  pomodoroRunningState.phase === 'shortBreak' ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercentage()}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!hideSubtaskButton && (
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
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[12px] min-h-[32px]"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single footer: meta left, equal ghost actions right */}
          <div className="mt-1 flex items-center gap-1">
            <div className="flex items-center gap-0.5 min-w-0 flex-1">
              {hasSubtasks && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 h-8 px-1 -ml-1 rounded-md touch-manipulation"
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span className="tabular-nums">{completedSubtasks}/{totalSubtasks}</span>
                </button>
              )}
              {!hideSubtaskButton && (
                <button
                  type="button"
                  onClick={onClickAddSubtask}
                  className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 h-8 px-1 rounded-md touch-manipulation"
                >
                  <Plus size={12} />
                  <span>Subtask</span>
                </button>
              )}
              {!isMinified && (
                <div className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                  <Clock size={11} /> {format(parseISO(createdAt), "PP p")}
                </div>
              )}
            </div>

            <div className="flex items-center shrink-0 -mr-1.5">
              {isDone && (
                <button
                  type="button"
                  onClick={() => onToggleDone(t)}
                  className={`${actionBtn} text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`}
                  data-tip="Undo"
                  aria-label="Undo"
                >
                  <RotateCcw size={iconSize} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenEditModal(t)}
                className={`${actionBtn} text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30`}
                data-tip="Edit"
                aria-label="Edit"
              >
                <Pencil size={iconSize} />
              </button>
              {onStartPomodoro && !isDone && (
                <button
                  type="button"
                  onClick={() => onStartPomodoro(t)}
                  disabled={isFutureTask}
                  className={`${actionBtn} ${
                    isFutureTask
                      ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                      : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                  }`}
                  data-tip={isFutureTask ? "Pomodoro only available for today's tasks" : "Start Pomodoro"}
                  aria-label={isFutureTask ? "Pomodoro only available for today's tasks" : "Start Pomodoro"}
                >
                  <Timer size={iconSize} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDeleteTask(t)}
                className={`${actionBtn} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30`}
                data-tip="Delete"
                aria-label="Delete"
              >
                <Trash size={iconSize} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TaskList({ tasks, onDragStartTask, onToggleDone, onOpenEditModal, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask, onStartPomodoro, fullHeight = false, showDueDate = false, density = 'normal', emptyMessage = null, recurringSeries = [], pomodoroRunningState = { isRunning: false, currentTask: null, timeLeft: null, phase: null, totalTime: null }, hidePriorityLabel = false, hideSubtaskButton = false }) {
  if (!tasks || tasks.length === 0) {
    const msg = emptyMessage || 'No tasks. Double-click any day to add one quickly.';
    return <div className="text-sm text-slate-400 dark:text-slate-500">{msg}</div>;
  }

  return (
    <div className={fullHeight
      ? `${density === 'minified' ? 'space-y-1.5' : density === 'compact' ? 'space-y-1.5 sm:space-y-2' : 'space-y-2 sm:space-y-3'} h-full overflow-auto pr-0.5 sm:pr-2`
      : `${density === 'minified' ? 'space-y-1.5' : density === 'compact' ? 'space-y-1.5 sm:space-y-2' : 'space-y-2 sm:space-y-3'} sm:max-h-[60vh] sm:overflow-auto pr-0.5 sm:pr-2`
    }>
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
          onStartPomodoro={onStartPomodoro}
          showDueDate={showDueDate}
          density={density}
          recurringSeries={recurringSeries}
          pomodoroRunningState={pomodoroRunningState}
          hidePriorityLabel={hidePriorityLabel}
          hideSubtaskButton={hideSubtaskButton}
        />
      ))}
    </div>
  );
}
