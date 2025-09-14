import React, { useMemo } from "react";
import { addDays, format, isSameDay, startOfWeek, isAfter, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, ListX, List, CheckCircle, FileText, Code as CodeIcon, StickyNote } from "lucide-react";
import TaskList from "./TaskList";

export default function WeekView({
  anchorDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  tasksFor,
  onSelectDate,
  selectedDate,
  onOpenAddForDate,
  hasNoteFor,
  missedCount = 0,
  onOpenMissed,
  onOpenNotes,
  snippets = [],
  dragOverDayKey,
  setDragOverDayKey,
  onDropTaskOnDay,
  onDragStartTask,
  onToggleDone,
  onOpenEditModal,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onStartPomodoro,
  recurringSeries = [],
  pomodoroRunningState = { isRunning: false, currentTask: null, timeLeft: null, phase: null, totalTime: null }
}) {
  // Function to open notes for a specific day
  const openNotesForDay = (day) => {
    if (onOpenNotes) {
      // Pass the specific day to the notes opening function
      onOpenNotes(day);
    }
  };
  const days = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [anchorDate]);

  // Weekly summary
  const totalTasks = useMemo(() => days.reduce((acc, d) => acc + (tasksFor ? tasksFor(d).length : 0), 0), [days, tasksFor]);
  const totalDone = useMemo(() => days.reduce((acc, d) => acc + (tasksFor ? tasksFor(d).filter(t => t.done).length : 0), 0), [days, tasksFor]);
  const notesCount = useMemo(() => days.reduce((acc, d) => acc + (hasNoteFor && hasNoteFor(d) ? 1 : 0), 0), [days, hasNoteFor]);
  const snippetsCount = useMemo(() => {
    try {
      const start = days[0];
      const end = days[6];
      return Array.isArray(snippets)
        ? snippets.reduce((acc, s) => {
            const raw = s?.createdAt;
            let created;
            try {
              if (typeof raw?.toDate === 'function') created = raw.toDate();
              else if (typeof raw === 'string') created = new Date(raw);
              else if (raw instanceof Date) created = raw;
              else if (typeof raw?.seconds === 'number') created = new Date(raw.seconds * 1000);
            } catch {}
            if (!created || isNaN(created.getTime())) return acc;
            if (created >= start && created <= end) return acc + 1;
            return acc;
          }, 0)
        : 0;
    } catch {
      return 0;
    }
  }, [days, snippets]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Week</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMissed}
            className="ml-2 relative text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 inline-flex items-center gap-2"
            aria-label="Show missed tasks this week"
            data-tip="Show missed tasks this week"
          >
            <ListX size={16} />
            <span>Missed</span>
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 tabular-nums">
              {Number(missedCount) || 0}
            </span>
          </button>
          <button onClick={onPrevWeek} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Previous week" data-tip="Previous week"><ChevronLeft size={16} /></button>
          <button onClick={onToday} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="This week" data-tip="This week"><Calendar size={16} /></button>
          <button onClick={onNextWeek} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Next week" data-tip="Next week"><ChevronRight size={16} /></button>
        </div>
      </div>
      
      {/* Weekly summary chips */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300"><List size={12} /> {totalTasks}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[11px] text-emerald-700 dark:text-emerald-300"><CheckCircle size={12} /> {totalDone}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[11px] text-blue-700 dark:text-blue-300"><FileText size={12} /> {notesCount}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-[11px] text-purple-700 dark:text-purple-300"><CodeIcon size={12} /> {snippetsCount}</span>
      </div>

      {/* 7 days task lists in horizontal layout */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const tasks = tasksFor ? tasksFor(day) : [];
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const doneCount = tasks.filter((t) => t.done).length;
          const totalCount = tasks.length;
          const hasNote = !!(hasNoteFor && hasNoteFor(day));
          const key = format(day, 'yyyy-MM-dd');
          const ringClass =
            dragOverDayKey === key
              ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-900'
              : isSelected
              ? 'ring-2 ring-indigo-500'
              : '';

          return (
            <div
              key={String(day)}
              className={`group relative border border-slate-200 dark:border-slate-800 rounded-lg p-2 min-h-[600px] flex flex-col ${ringClass}`}
              onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {} setDragOverDayKey && setDragOverDayKey(key); }}
              onDragEnter={() => setDragOverDayKey && setDragOverDayKey(key)}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDayKey && setDragOverDayKey((k) => (k === key ? null : k)); }}
              onDrop={(e) => { onDropTaskOnDay && onDropTaskOnDay(e, day); setDragOverDayKey && setDragOverDayKey(null); }}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{format(day, 'EEE')}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{format(day, 'MMM d')}</div>
                </div>
                <div className="flex items-center gap-1">
                  {hasNote && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" data-tip="Notes present" />
                  )}
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {doneCount}/{totalCount}
                  </span>
                </div>
              </div>

              {/* Add task and notes buttons */}
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => onOpenAddForDate && onOpenAddForDate(day)}
                  className="flex-1 p-1.5 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-md hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  + Add task
                </button>
                <button
                  onClick={() => openNotesForDay(day)}
                  className="p-1.5 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-md hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={`Open notes for ${format(day, 'MMM d')}`}
                  data-tip={`Open notes for ${format(day, 'MMM d')}`}
                >
                  <StickyNote size={14} />
                </button>
              </div>

              {/* Task list for this day */}
              <div className="flex-1 min-h-0 overflow-y-auto">
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
                  density="minified"
                  emptyMessage="No tasks for this day"
                  recurringSeries={recurringSeries}
                  pomodoroRunningState={pomodoroRunningState}
                  hidePriorityLabel={true}
                  hideSubtaskButton={true}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
