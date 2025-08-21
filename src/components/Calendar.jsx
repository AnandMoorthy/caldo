import React from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ListX } from "lucide-react";

export default function Calendar({
  monthStart,
  monthDays,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  tasksFor,
  hasNoteFor,
  onOpenAddModal,
  dragOverDayKey,
  setDragOverDayKey,
  onDropTaskOnDay,
  missedCount = 0,
  onOpenMissed,
}) {
  return (
    <section className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onPrevMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <div className="text-lg font-semibold w-44 sm:w-56 text-center select-none text-slate-900 dark:text-slate-100">{format(monthStart, "MMMM yyyy")}</div>
          <button onClick={onNextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMissed}
            className="relative text-sm px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 inline-flex items-center gap-2"
            aria-label="Show missed tasks"
            data-tip="Show missed tasks this month"
          >
            <ListX size={16} />
            <span>Missed</span>
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 tabular-nums">
              {Number(missedCount) || 0}
            </span>
          </button>
          <button onClick={() => onSelectDate(new Date())} className="text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center py-2">
            {d}
          </div>
        ))}

        {monthDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const tasks = tasksFor(day);
          const doneCount = tasks.filter((t) => t.done).length;
          const inMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const baseBg = inMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500";
          const ringClass =
            dragOverDayKey === key
              ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
              : isSelected
              ? "ring-2 ring-indigo-500"
              : isToday
              ? "ring-2 ring-indigo-300"
              : "";
          const selectedBg = isSelected ? "bg-indigo-50 dark:bg-indigo-950/40" : "";
          const totalCount = tasks.length;
          const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          const prioCount = tasks.reduce(
            (acc, t) => {
              const p = String(t.priority || 'medium');
              if (p === 'high') acc.high += 1; else if (p === 'low') acc.low += 1; else acc.medium += 1;
              return acc;
            },
            { high: 0, medium: 0, low: 0 }
          );
          const hasNote = !!(hasNoteFor && hasNoteFor(day));
          return (
            <motion.div
              key={key}
              layout
              onDoubleClick={() => onOpenAddModal(day)}
              onClick={() => onSelectDate(day)}
              onDragOver={(e) => {
                e.preventDefault();
                try {
                  e.dataTransfer.dropEffect = "move";
                } catch {}
                setDragOverDayKey(key);
              }}
              onDragEnter={() => setDragOverDayKey(key)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDayKey((k) => (k === key ? null : k));
              }}
              onDrop={(e) => onDropTaskOnDay(e, day)}
              aria-selected={isSelected}
              className={`group border border-slate-200 dark:border-slate-800 rounded-lg p-1 sm:p-2 min-h-[56px] sm:min-h-[88px] cursor-pointer relative ${baseBg} ${selectedBg} ${ringClass}`}
            >
              <div className="flex items-start justify-between">
                <div className={isSelected ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 text-white text-[11px] sm:text-xs flex items-center justify-center font-semibold" : "text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"}>
                  {format(day, "d")}
                </div>
                <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 relative">{format(day, "MMM")}</div>
              </div>
              {/* Hover card summary - only show if there are tasks or notes */}
              {(tasks.length > 0 || hasNote) && (
                <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-30">
                  <div className="opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 ease-out">
                    <div className="w-56 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{format(day, 'EEE, MMM d')}</div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{doneCount}/{totalCount} done</div>
                        {hasNote && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400" aria-label="Notes present">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                            Notes present
                          </span>
                        )}
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${percent}%` }} />
                      </div>
                      {totalCount > 0 ? (
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> {prioCount.high} high
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" /> {prioCount.medium} med
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {prioCount.low} low
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">No tasks</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {(tasks.length > 0 || (hasNoteFor && hasNoteFor(day))) && (
                <div
                  className="absolute bottom-1 right-1 flex items-center gap-0.5"
                >
                  {hasNoteFor && hasNoteFor(day) && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"
                      data-tip="Notes present"
                    />
                  )}
                  {(() => {
                    const hasNote = !!(hasNoteFor && hasNoteFor(day));
                    const maxDots = 3;
                    const taskDots = Math.min(maxDots - (hasNote ? 1 : 0), tasks.length);
                    return Array.from({ length: taskDots }).map((_, idx) => (
                      <span
                        key={`t-${idx}`}
                        className={`${doneCount === 0 ? "bg-red-400" : doneCount === tasks.length ? "bg-green-500" : "bg-amber-400"} inline-block w-1.5 h-1.5 rounded-full`}
                      />
                    ));
                  })()}
                  {(() => {
                    const hasNote = !!(hasNoteFor && hasNoteFor(day));
                    const maxDots = 3;
                    const taskDotsShown = Math.min(maxDots - (hasNote ? 1 : 0), tasks.length);
                    const overflow = tasks.length - taskDotsShown;
                    return overflow > 0 ? (
                      <span className="text-[9px] leading-none text-slate-400 dark:text-slate-500 ml-0.5">+{overflow}</span>
                    ) : null;
                  })()}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}


