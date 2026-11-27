import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, List, CheckCircle, FileText, StickyNote, Plus } from "lucide-react";
import TaskList from "./TaskList";

const COLUMN_TRANSITION_MS = 440;
const CONTENT_FADE_MS = 240;
const HOVER_INTENT_MS = 90;
const LEAVE_RESTORE_MS = 240;
const CONTENT_REVEAL_MS = Math.round(COLUMN_TRANSITION_MS * 0.32);

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
  const openNotesForDay = (day) => {
    if (onOpenNotes) onOpenNotes(day);
  };

  const days = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [anchorDate]);

  const dayKeys = useMemo(() => days.map((d) => format(d, "yyyy-MM-dd")), [days]);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const defaultFocusKey = dayKeys.includes(todayKey) ? todayKey : dayKeys[0];

  // Hover/focus expands a day; null means fall back to today (or first day of week)
  const [hoveredDayKey, setHoveredDayKey] = useState(null);
  const [contentDayKey, setContentDayKey] = useState(defaultFocusKey);
  const leaveTimerRef = useRef(null);
  const hoverIntentRef = useRef(null);
  const contentTimerRef = useRef(null);
  const focusedDayKey = hoveredDayKey && dayKeys.includes(hoveredDayKey) ? hoveredDayKey : defaultFocusKey;

  const focusDay = useCallback((key, { immediate = false } = {}) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (hoverIntentRef.current) {
      clearTimeout(hoverIntentRef.current);
      hoverIntentRef.current = null;
    }

    const apply = () => {
      setHoveredDayKey(key);
    };

    if (immediate) {
      apply();
      return;
    }

    // Tiny settle so skimming across day edges doesn't thrash the layout.
    hoverIntentRef.current = setTimeout(() => {
      apply();
      hoverIntentRef.current = null;
    }, HOVER_INTENT_MS);
  }, []);

  const clearFocusSoon = useCallback(() => {
    if (hoverIntentRef.current) {
      clearTimeout(hoverIntentRef.current);
      hoverIntentRef.current = null;
    }
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHoveredDayKey(null);
      leaveTimerRef.current = null;
    }, LEAVE_RESTORE_MS);
  }, []);

  // Columns follow focusedDayKey immediately. Detailed chrome / task density trail
  // slightly so the width morph leads and the reveal feels calm rather than snappy.
  useEffect(() => {
    let cancelled = false;
    if (contentDayKey === focusedDayKey) return undefined;

    contentTimerRef.current = setTimeout(() => {
      if (!cancelled) {
        setContentDayKey(focusedDayKey);
        contentTimerRef.current = null;
      }
    }, CONTENT_REVEAL_MS);

    return () => {
      cancelled = true;
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
    };
  }, [focusedDayKey, contentDayKey]);

  useEffect(() => {
    setHoveredDayKey(null);
    setContentDayKey(defaultFocusKey);
  }, [dayKeys.join("|"), defaultFocusKey]);

  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    if (hoverIntentRef.current) clearTimeout(hoverIntentRef.current);
    if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
  }, []);

  const dayRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    const todayDay = days.find((day) => isSameDay(day, today));
    if (!todayDay) return;
    const isMobile = window.innerWidth < 640;
    if (!isMobile) return;
    const timeoutId = setTimeout(() => {
      const dayKey = format(todayDay, "yyyy-MM-dd");
      const dayElement = dayRefs.current[dayKey];
      if (dayElement) dayElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [days]);

  const totalTasks = useMemo(() => days.reduce((acc, d) => acc + (tasksFor ? tasksFor(d).length : 0), 0), [days, tasksFor]);
  const totalDone = useMemo(() => days.reduce((acc, d) => acc + (tasksFor ? tasksFor(d).filter((t) => t.done).length : 0), 0), [days, tasksFor]);
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
              if (typeof raw?.toDate === "function") created = raw.toDate();
              else if (typeof raw === "string") created = new Date(raw);
              else if (raw instanceof Date) created = raw;
              else if (typeof raw?.seconds === "number") created = new Date(raw.seconds * 1000);
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

  // Plain fr tracks interpolate more cleanly than minmax() during grid transitions.
  const gridTemplateColumns = days
    .map((day) => (format(day, "yyyy-MM-dd") === focusedDayKey ? "2.6fr" : "0.75fr"))
    .join(" ");

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800 flex flex-col sm:min-h-0 sm:h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Week</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {format(days[0], "MMM d")} – {format(days[6], "MMM d, yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={onPrevWeek} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Previous week" data-tip="Previous week">
              <ChevronLeft size={16} />
            </button>
            <button onClick={onToday} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="This week" data-tip="This week">
              <Calendar size={16} />
            </button>
            <button onClick={onNextWeek} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Next week" data-tip="Next week">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
          <List size={12} /> {totalTasks}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[11px] text-emerald-700 dark:text-emerald-300">
          <CheckCircle size={12} /> {totalDone}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[11px] text-blue-700 dark:text-blue-300">
          <FileText size={12} /> {notesCount}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-[11px] text-purple-700 dark:text-purple-300">
          <StickyNote size={12} /> {snippetsCount}
        </span>
        <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500 ml-1">
          Hover a day to expand it
        </span>
      </div>

      <div
        ref={containerRef}
        className="week-day-grid flex flex-col gap-3 sm:flex-1 sm:min-h-0 sm:overflow-hidden sm:grid sm:gap-0"
        style={{
          gridTemplateColumns,
          transition: `grid-template-columns ${COLUMN_TRANSITION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
        onMouseLeave={clearFocusSoon}
      >
        {days.map((day) => {
          const tasks = tasksFor ? tasksFor(day) : [];
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const isToday = isSameDay(day, new Date());
          const doneCount = tasks.filter((t) => t.done).length;
          const totalCount = tasks.length;
          const hasNote = !!(hasNoteFor && hasNoteFor(day));
          const key = format(day, "yyyy-MM-dd");
          const isExpanded = key === focusedDayKey;
          // Collapse chrome as soon as focus leaves; reveal on the new day only after
          // contentDayKey catches up so the column can lead the motion.
          const showExpandedContent = isExpanded && key === contentDayKey;

          const ringClass =
            dragOverDayKey === key
              ? "ring-2 ring-inset ring-indigo-400"
              : isSelected
              ? "ring-2 ring-inset ring-indigo-500"
              : isToday
              ? "ring-2 ring-inset ring-indigo-300 dark:ring-indigo-600"
              : isExpanded
              ? "ring-2 ring-inset ring-slate-300 dark:ring-slate-600"
              : "";

          return (
            <div
              key={String(day)}
              ref={(el) => {
                if (el) dayRefs.current[key] = el;
              }}
              className={`week-day-cell group relative sm:px-1 flex flex-col min-h-[220px] sm:min-h-0 sm:h-full`}
              onMouseEnter={() => focusDay(key)}
              onFocusCapture={() => focusDay(key, { immediate: true })}
              onClick={() => focusDay(key, { immediate: true })}
              onDragOver={(e) => {
                e.preventDefault();
                try {
                  e.dataTransfer.dropEffect = "move";
                } catch {}
                setDragOverDayKey && setDragOverDayKey(key);
              }}
              onDragEnter={() => setDragOverDayKey && setDragOverDayKey(key)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDayKey && setDragOverDayKey((k) => (k === key ? null : k));
              }}
              onDrop={(e) => {
                onDropTaskOnDay && onDropTaskOnDay(e, day);
                setDragOverDayKey && setDragOverDayKey(null);
              }}
            >
              <div
                className={`relative border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col min-h-0 h-full overflow-hidden transition-[padding,background-color,box-shadow,border-color] duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                  isExpanded ? "p-2.5 bg-slate-50/60 dark:bg-slate-800/30" : "p-1.5 sm:p-1.5"
                } ${ringClass}`}
              >
                <div className={`flex items-center justify-between transition-[margin] duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isExpanded ? "mb-2" : "mb-1"}`}>
                  <div className="min-w-0">
                    <div
                      className={`font-semibold text-slate-900 dark:text-slate-100 truncate transition-[font-size] duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                        isExpanded ? "text-sm" : "text-[11px]"
                      }`}
                    >
                      {format(day, "EEE")}
                      {isToday && (
                        <span
                          className={`ml-1.5 text-[10px] font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400 transition-opacity duration-200 ${
                            showExpandedContent ? "opacity-100" : "opacity-0"
                          }`}
                          style={{ transitionDuration: `${CONTENT_FADE_MS}ms` }}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <div
                      className={`tabular-nums transition-opacity duration-200 ${
                        showExpandedContent
                          ? "text-xs text-slate-500 dark:text-slate-400 opacity-100"
                          : "text-[10px] text-slate-400 dark:text-slate-500 opacity-100"
                      }`}
                      style={{ transitionDuration: `${CONTENT_FADE_MS}ms` }}
                    >
                      {showExpandedContent ? format(day, "MMM d") : format(day, "d")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasNote && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" data-tip="Notes present" />}
                    <span
                      className={`font-medium text-slate-600 dark:text-slate-300 tabular-nums transition-[font-size] duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                        isExpanded ? "text-xs" : "text-[10px]"
                      }`}
                    >
                      {doneCount}/{totalCount}
                    </span>
                  </div>
                </div>

                <div className="relative mb-1 sm:mb-2 min-h-[1.5rem]">
                  <div
                    className={`flex items-center gap-1 transition-opacity ease-out ${
                      showExpandedContent ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"
                    }`}
                    style={{ transitionDuration: `${CONTENT_FADE_MS}ms` }}
                    aria-hidden={!showExpandedContent}
                  >
                    <button
                      onClick={() => onOpenAddForDate && onOpenAddForDate(day)}
                      className="flex-1 p-1.5 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-md hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      + Add task
                    </button>
                    <button
                      onClick={() => openNotesForDay(day)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-md hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      aria-label={`Open notes for ${format(day, "MMM d")}`}
                      data-tip={`Open notes for ${format(day, "MMM d")}`}
                      tabIndex={showExpandedContent ? 0 : -1}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                  <div
                    className={`flex items-center gap-0.5 transition-opacity ease-out ${
                      showExpandedContent ? "opacity-0 absolute inset-0 pointer-events-none" : "opacity-100 relative"
                    }`}
                    style={{ transitionDuration: `${CONTENT_FADE_MS}ms` }}
                    aria-hidden={showExpandedContent}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddForDate && onOpenAddForDate(day);
                      }}
                      className="flex-1 inline-flex items-center justify-center h-6 rounded border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={`Add task for ${format(day, "MMM d")}`}
                      data-tip={`Add task for ${format(day, "MMM d")}`}
                      tabIndex={showExpandedContent ? -1 : 0}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNotesForDay(day);
                      }}
                      className="inline-flex items-center justify-center h-6 w-6 rounded border border-slate-300 dark:border-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={`Open notes for ${format(day, "MMM d")}`}
                      data-tip={`Open notes for ${format(day, "MMM d")}`}
                      tabIndex={showExpandedContent ? -1 : 0}
                    >
                      <StickyNote size={11} />
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 min-h-0 transition-opacity ease-out"
                  style={{
                    transitionDuration: `${CONTENT_FADE_MS}ms`,
                    opacity: key === focusedDayKey || key === contentDayKey ? 1 : 0.92,
                  }}
                >
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
                    density={showExpandedContent ? "compact" : "minified"}
                    fullHeight
                    emptyMessage={showExpandedContent ? "No tasks for this day" : ""}
                    recurringSeries={recurringSeries}
                    pomodoroRunningState={pomodoroRunningState}
                    hidePriorityLabel={true}
                    hideSubtaskButton={true}
                    hideActions={!showExpandedContent}
                    wrapTitle={showExpandedContent}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
