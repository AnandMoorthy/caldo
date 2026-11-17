import React, { useEffect, useMemo, useRef, useState } from "react";
import { format, isAfter, startOfDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, StickyNote, List, Grip, Minimize2, ChevronLeft, ChevronRight, Calendar, ListX, Check } from "lucide-react";
import TaskList from "./TaskList.jsx";
import { getMotivationalMessageForCount } from "../utils/motivation.js";
import { keyFor } from "../utils/date.js";

const DAY_SWITCH_MS = 550;

export default function DayView({
  date,
  onPrevDay,
  onNextDay,
  onToday,
  tasks,
  onDragStartTask,
  onDragEndTask,
  onToggleDone,
  onOpenEditModal,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  density = 'normal',
  onAddTask,
  onOpenNotes,
  onOpenMissed,
  missedCount = 0,
  showDensityMenu = false,
  setShowDensityMenu,
  onChangeDensity,
  densityMenuRef,
  recurringSeries = [],
  onStartPomodoro = null,
  pomodoroRunningState = { isRunning: false, currentTask: null, timeLeft: null, phase: null, totalTime: null },
  movingTask = null,
  onConfirmMoveToDay = null,
  onCancelMove = null,
  onDropTaskOnDay = null,
  tasksLoading = false,
}) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [slideDir, setSlideDir] = useState(0);
  const [isDragOverDay, setIsDragOverDay] = useState(false);
  const [edgeHover, setEdgeHover] = useState(null); // 'prev' | 'next' | null
  const prevKeyRef = useRef(keyFor(date));
  const daySwitchTimerRef = useRef(null);
  const edgeDirRef = useRef(null);
  const onPrevDayRef = useRef(onPrevDay);
  const onNextDayRef = useRef(onNextDay);
  onPrevDayRef.current = onPrevDay;
  onNextDayRef.current = onNextDay;
  const minSwipeDistance = 50;
  const isMoving = !!movingTask;

  useEffect(() => {
    const nextKey = keyFor(date);
    if (nextKey !== prevKeyRef.current) {
      // Keep the last swipe direction if set; otherwise infer from date order.
      if (slideDir === 0) {
        setSlideDir(nextKey > prevKeyRef.current ? 1 : -1);
      }
      prevKeyRef.current = nextKey;
    }
  }, [date, slideDir]);

  const clearDaySwitchTimer = () => {
    if (daySwitchTimerRef.current) {
      clearTimeout(daySwitchTimerRef.current);
      daySwitchTimerRef.current = null;
    }
  };

  const scheduleDaySwitch = (direction) => {
    if (edgeDirRef.current !== direction) {
      edgeDirRef.current = direction;
      setEdgeHover(direction);
      clearDaySwitchTimer();
    }
    if (daySwitchTimerRef.current) return;
    daySwitchTimerRef.current = setTimeout(function tick() {
      if (direction === 'prev') {
        setSlideDir(-1);
        onPrevDayRef.current && onPrevDayRef.current();
      } else {
        setSlideDir(1);
        onNextDayRef.current && onNextDayRef.current();
      }
      daySwitchTimerRef.current = setTimeout(tick, DAY_SWITCH_MS);
    }, DAY_SWITCH_MS);
  };

  // While dragging, dwell near the left/right screen edge to change days.
  // This survives day re-renders better than relying only on tiny button hit targets.
  useEffect(() => {
    if (!isMoving) {
      clearDaySwitchTimer();
      edgeDirRef.current = null;
      setEdgeHover(null);
      return;
    }
    const EDGE_PX = 56;
    function onDragOver(e) {
      const x = e.clientX;
      const w = window.innerWidth || 0;
      if (x <= EDGE_PX) scheduleDaySwitch('prev');
      else if (x >= w - EDGE_PX) scheduleDaySwitch('next');
      else {
        clearDaySwitchTimer();
        edgeDirRef.current = null;
        setEdgeHover(null);
      }
    }
    function onDragEndClear() {
      clearDaySwitchTimer();
      edgeDirRef.current = null;
      setEdgeHover(null);
    }
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragend', onDragEndClear);
    window.addEventListener('drop', onDragEndClear);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragend', onDragEndClear);
      window.removeEventListener('drop', onDragEndClear);
      clearDaySwitchTimer();
    };
  }, [isMoving]);

  useEffect(() => {
    return () => {
      clearDaySwitchTimer();
    };
  }, []);

  const goPrev = () => {
    setSlideDir(-1);
    onPrevDay();
  };
  const goNext = () => {
    setSlideDir(1);
    onNextDay();
  };

  const onTouchStart = (e) => {
    if (isMoving) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    const target = e.target;
    const isInteractive = target.tagName === 'BUTTON' ||
                          target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.closest('button') !== null ||
                          target.closest('input') !== null ||
                          target.closest('textarea') !== null ||
                          target.closest('[role="button"]') !== null ||
                          target.closest('[data-day-edge]') !== null;

    if (isInteractive) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    setTouchEnd(null);
    const touch = e.targetTouches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    const target = e.target;
    const isInteractive = target.closest('button') !== null ||
                          target.closest('input') !== null ||
                          target.closest('textarea') !== null;
    if (isInteractive) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    const touch = e.targetTouches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const absDistanceX = Math.abs(distanceX);
    const absDistanceY = Math.abs(distanceY);

    if (absDistanceX > absDistanceY && absDistanceX > minSwipeDistance) {
      if (distanceX > 0) goNext();
      else goPrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const isMobile = typeof window !== 'undefined' &&
    (window.innerWidth < 640 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Feature flag — set true to bring motivational quotes back
  const ENABLE_MOTIVATIONAL_MESSAGES = false;

  const incompleteTasks = tasks.filter((t) => !t.done);
  const dateKey = keyFor(date);
  const showMoveBanner = isMoving && movingTask.fromKey && movingTask.fromKey !== dateKey;
  const todayStart = startOfDay(new Date());
  const dateStart = startOfDay(date);
  const isDateTodayOrPast = !isAfter(dateStart, todayStart);
  const shouldShowMessage = ENABLE_MOTIVATIONAL_MESSAGES && incompleteTasks.length > 0 && isDateTodayOrPast;
  const motivationalMessage = useMemo(() => {
    if (!shouldShowMessage) return null;
    return getMotivationalMessageForCount(incompleteTasks.length);
  }, [dateKey, incompleteTasks.length, shouldShowMessage]);

  const touchBtn = "inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700 touch-manipulation";
  const edgeActiveCls = "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 ring-2 ring-indigo-400/60";

  const allowDragNav = (e) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
  };

  const handleDropOnDay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDay(false);
    clearDaySwitchTimer();
    setEdgeHover(null);
    if (onDropTaskOnDay) onDropTaskOnDay(e, date);
  };

  return (
    <section
      className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800 flex flex-col h-full min-h-0 relative"
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
      <div className="mb-3 sm:mb-4 shrink-0">
        {/* Mobile layout */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Tasks for</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{format(date, 'EEEE, MMM d')}</div>
            </div>
            <button type="button" onClick={onAddTask} className="bg-indigo-600 text-white min-h-[44px] min-w-[44px] rounded-xl inline-flex items-center justify-center shadow-sm touch-manipulation" aria-label="Add task (T)" data-tip="Add task (T)">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={goPrev}
                onDragEnter={(e) => { allowDragNav(e); scheduleDaySwitch('prev'); }}
                onDragOver={allowDragNav}
                onDragLeave={() => { clearDaySwitchTimer(); setEdgeHover(null); }}
                className={`${touchBtn} ${edgeHover === 'prev' ? edgeActiveCls : ''}`}
                aria-label="Previous day"
                data-tip="Previous day"
              >
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={onToday} className={`${touchBtn} px-3 min-w-0 text-xs font-medium`} aria-label="Today" data-tip="Today">
                Today
              </button>
              <button
                type="button"
                onClick={goNext}
                onDragEnter={(e) => { allowDragNav(e); scheduleDaySwitch('next'); }}
                onDragOver={allowDragNav}
                onDragLeave={() => { clearDaySwitchTimer(); setEdgeHover(null); }}
                className={`${touchBtn} ${edgeHover === 'next' ? edgeActiveCls : ''}`}
                aria-label="Next day"
                data-tip="Next day"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {typeof onOpenMissed === 'function' && (
                <button
                  type="button"
                  onClick={onOpenMissed}
                  className={`${touchBtn} relative`}
                  aria-label="Missed tasks"
                  data-tip="Missed tasks"
                >
                  <ListX size={18} />
                  {missedCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold inline-flex items-center justify-center">
                      {missedCount > 99 ? '99+' : missedCount}
                    </span>
                  )}
                </button>
              )}
              <div className="relative" ref={densityMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDensityMenu && setShowDensityMenu((v) => !v);
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className={touchBtn}
                  aria-label="Task card density"
                  data-tip="Task card density"
                >
                  {density === 'minified' ? <Minimize2 size={18} /> : density === 'compact' ? <Grip size={18} /> : <List size={18} />}
                </button>
                {showDensityMenu && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1"
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {['normal', 'compact', 'minified'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeDensity && onChangeDensity(value);
                          setShowDensityMenu && setShowDensityMenu(false);
                        }}
                        className={`w-full flex items-center justify-start gap-2 p-2.5 min-h-[44px] rounded ${density === value ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        aria-label={`${value} density`}
                      >
                        {value === 'minified' ? <Minimize2 size={16} /> : value === 'compact' ? <Grip size={16} /> : <List size={16} />}
                        <span className="text-sm capitalize">{value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={onOpenNotes} className={touchBtn} aria-label="Open notes (N)" data-tip="Open notes (N)">
                <StickyNote size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Tasks for</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{format(date, 'EEEE, MMM d')}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              onDragEnter={(e) => { allowDragNav(e); scheduleDaySwitch('prev'); }}
              onDragOver={allowDragNav}
              onDragLeave={() => { clearDaySwitchTimer(); setEdgeHover(null); }}
              className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${edgeHover === 'prev' ? edgeActiveCls : ''}`}
              aria-label="Previous day"
              data-tip="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={onToday} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Today" data-tip="Today">
              <Calendar size={16} />
            </button>
            <button
              type="button"
              onClick={goNext}
              onDragEnter={(e) => { allowDragNav(e); scheduleDaySwitch('next'); }}
              onDragOver={allowDragNav}
              onDragLeave={() => { clearDaySwitchTimer(); setEdgeHover(null); }}
              className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${edgeHover === 'next' ? edgeActiveCls : ''}`}
              aria-label="Next day"
              data-tip="Next day"
            >
              <ChevronRight size={16} />
            </button>
            <span className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" aria-hidden="true" />
            {typeof onOpenMissed === 'function' && (
              <button
                type="button"
                onClick={onOpenMissed}
                className="relative bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-center"
                aria-label="Missed tasks"
                data-tip="Missed tasks"
              >
                <ListX size={16} />
                {missedCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold inline-flex items-center justify-center">
                    {missedCount > 99 ? '99+' : missedCount}
                  </span>
                )}
              </button>
            )}
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
                <div className="absolute right-0 z-50 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1">
                  {['normal', 'compact', 'minified'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { onChangeDensity && onChangeDensity(value); setShowDensityMenu && setShowDensityMenu(false); }}
                      className={`w-full flex items-center justify-start gap-2 p-2 rounded ${density === value ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      aria-label={`${value} density`}
                    >
                      {value === 'minified' ? <Minimize2 size={16} /> : value === 'compact' ? <Grip size={16} /> : <List size={16} />}
                      <span className="text-sm capitalize">{value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={onOpenNotes} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-center" aria-label="Open notes (N)" data-tip="Open notes (N)">
              <StickyNote size={16} />
            </button>
            <button type="button" onClick={onAddTask} className="bg-indigo-600 text-white p-2 rounded-lg inline-flex items-center justify-center" aria-label="Add task (T)" data-tip="Add task (T)">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {isMoving && (
        <div className="mb-3 shrink-0 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-3">
          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Moving task</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mb-2">
            {movingTask.title || 'Untitled'}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            {showMoveBanner
              ? 'Drop on this day or tap Move here. Use arrows to keep changing days.'
              : 'Drag to the screen edges or day arrows to switch days, then drop.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className={`${touchBtn} flex-1 sm:flex-none sm:px-3 gap-1 text-xs font-medium`}
              aria-label="Previous day while moving"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className={`${touchBtn} flex-1 sm:flex-none sm:px-3 gap-1 text-xs font-medium`}
              aria-label="Next day while moving"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
            {showMoveBanner && (
              <button
                type="button"
                onClick={() => onConfirmMoveToDay && onConfirmMoveToDay(date)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold touch-manipulation"
              >
                <Check size={16} />
                Move here
              </button>
            )}
            <button
              type="button"
              onClick={() => onCancelMove && onCancelMove()}
              className={`${touchBtn} px-3 text-xs font-medium`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {shouldShowMessage && motivationalMessage && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shrink-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {motivationalMessage}
          </p>
        </div>
      )}

      <div
        className={`flex-1 min-h-0 overflow-hidden relative rounded-xl transition-colors ${
          isDragOverDay || isMoving
            ? 'ring-2 ring-indigo-400/70 bg-indigo-50/40 dark:bg-indigo-950/20'
            : ''
        }`}
        onDragOver={(e) => {
          if (!onDropTaskOnDay && !isMoving) return;
          e.preventDefault();
          try { e.dataTransfer.dropEffect = 'move'; } catch {}
          setIsDragOverDay(true);
        }}
        onDragEnter={(e) => {
          if (!onDropTaskOnDay && !isMoving) return;
          e.preventDefault();
          setIsDragOverDay(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverDay(false);
        }}
        onDrop={handleDropOnDay}
      >
        {isMoving && (
          <>
            <div
              data-day-edge="prev"
              className={`pointer-events-none absolute left-0 top-0 bottom-0 z-20 w-10 flex items-center justify-center transition-opacity ${edgeHover === 'prev' ? 'opacity-100 bg-gradient-to-r from-indigo-100/90 dark:from-indigo-950/70 to-transparent' : 'opacity-40 bg-gradient-to-r from-indigo-50/80 dark:from-indigo-950/40 to-transparent'}`}
            >
              <ChevronLeft size={18} className="text-indigo-600 dark:text-indigo-300" />
            </div>
            <div
              data-day-edge="next"
              className={`pointer-events-none absolute right-0 top-0 bottom-0 z-20 w-10 flex items-center justify-center transition-opacity ${edgeHover === 'next' ? 'opacity-100 bg-gradient-to-l from-indigo-100/90 dark:from-indigo-950/70 to-transparent' : 'opacity-40 bg-gradient-to-l from-indigo-50/80 dark:from-indigo-950/40 to-transparent'}`}
            >
              <ChevronRight size={18} className="text-indigo-600 dark:text-indigo-300" />
            </div>
          </>
        )}

        <AnimatePresence mode="wait" initial={false} custom={slideDir}>
          <motion.div
            key={dateKey}
            custom={slideDir}
            initial={(dir) => ({ opacity: 0, x: (dir || 1) * 24 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(dir) => ({ opacity: 0, x: (dir || 1) * -24 })}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full"
            onAnimationComplete={() => setSlideDir(0)}
          >
            <TaskList
              tasks={tasks}
              onDragStartTask={onDragStartTask}
              onDragEndTask={onDragEndTask}
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
              loading={tasksLoading}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
