import React, { useMemo } from "react";
import { format, isAfter, startOfDay } from "date-fns";
import { Plus, StickyNote, List, Grip, Minimize2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import TaskList from "./TaskList.jsx";
import { getMotivationalMessageForCount } from "../utils/motivation.js";
import { keyFor } from "../utils/date.js";

export default function DayView({
  date,
  onPrevDay,
  onNextDay,
  onToday,
  tasks,
  onDragStartTask,
  onToggleDone,
  onOpenEditModal,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  density = 'normal',
  onAddTask,
  onOpenNotes,
  showDensityMenu = false,
  setShowDensityMenu,
  onChangeDensity,
  densityMenuRef,
  recurringSeries = [],
  onStartPomodoro = null,
  pomodoroRunningState = { isRunning: false, currentTask: null, timeLeft: null, phase: null, totalTime: null },
}) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Tasks for</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{format(date, 'EEEE, MMM d')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrevDay} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Previous day" data-tip="Previous day">
            <ChevronLeft size={16} />
          </button>
          <button onClick={onToday} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Today" data-tip="Today">
            <Calendar size={16} />
          </button>
          <button onClick={onNextDay} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Next day" data-tip="Next day">
            <ChevronRight size={16} />
          </button>
          <span className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" aria-hidden="true" />
          <div className="relative" ref={densityMenuRef}>
            <button
              type="button"
              onClick={() => setShowDensityMenu && setShowDensityMenu((v) => !v)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-center"
              aria-label="Task card density"
              data-tip="Task card density"
            >
              {density === 'minified' ? <Minimize2 size={16} /> : density === 'compact' ? <Grip size={16} /> : <List size={16} />}
            </button>
            {showDensityMenu && (
              <div className="absolute right-0 z-10 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1">
                <button
                  type="button"
                  onClick={() => { onChangeDensity && onChangeDensity('normal'); setShowDensityMenu && setShowDensityMenu(false); }}
                  className={`w-full flex items-center justify-start gap-2 p-2 rounded ${density === 'normal' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  aria-label="Normal density"
                >
                  <List size={16} />
                  <span className="text-sm">Normal</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onChangeDensity && onChangeDensity('compact'); setShowDensityMenu && setShowDensityMenu(false); }}
                  className={`w-full flex items-center justify-start gap-2 p-2 rounded ${density === 'compact' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  aria-label="Compact density"
                >
                  <Grip size={16} />
                  <span className="text-sm">Compact</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onChangeDensity && onChangeDensity('minified'); setShowDensityMenu && setShowDensityMenu(false); }}
                  className={`w-full flex items-center justify-start gap-2 p-2 rounded ${density === 'minified' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  aria-label="Minified density"
                >
                  <Minimize2 size={16} />
                  <span className="text-sm">Minified</span>
                </button>
              </div>
            )}
          </div>
          <button onClick={onOpenNotes} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-center" aria-label="Open notes (N)" data-tip="Open notes (N)">
            <StickyNote size={16} />
          </button>
          <button onClick={onAddTask} className="bg-indigo-600 text-white p-2 rounded-lg inline-flex items-center justify-center" aria-label="Add task (T)" data-tip="Add task (T)">
            <Plus size={16} />
          </button>
        </div>
      </div>
      {(() => {
        const incompleteTasks = tasks.filter(t => !t.done);
        const dateKey = keyFor(date);
        const today = new Date();
        const todayStart = startOfDay(today);
        const dateStart = startOfDay(date);
        const isDateTodayOrPast = !isAfter(dateStart, todayStart);
        const shouldShowMessage = incompleteTasks.length > 0 && isDateTodayOrPast;
        
        // Memoize the message so it doesn't change on every re-render
        const motivationalMessage = useMemo(() => {
          if (!shouldShowMessage) return null;
          return getMotivationalMessageForCount(incompleteTasks.length);
        }, [dateKey, incompleteTasks.length, shouldShowMessage]);
        
        if (!shouldShowMessage || !motivationalMessage) return null;
        
        return (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {motivationalMessage}
            </p>
          </div>
        );
      })()}
      <div className="flex-1 min-h-0">
        <TaskList
          tasks={tasks}
          onDragStartTask={onDragStartTask}
          onToggleDone={onToggleDone}
          onOpenEditModal={onOpenEditModal}
          onDeleteTask={onDeleteTask}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onStartPomodoro={onStartPomodoro}
          density={density}
          emptyMessage="No tasks. Add a new task to view."
          recurringSeries={recurringSeries}
          pomodoroRunningState={pomodoroRunningState}
          fullHeight={true}
        />
      </div>
    </section>
  );
}


