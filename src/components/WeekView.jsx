import React, { useMemo } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, ListX } from "lucide-react";

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
}) {
  const days = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [anchorDate]);

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
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const list = tasksFor ? tasksFor(day) : [];
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const doneCount = list.filter((t) => t.done).length;
          const totalCount = list.length;
          const hasNote = !!(hasNoteFor && hasNoteFor(day));
          const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          const prioCount = list.reduce(
            (acc, t) => {
              const p = String(t.priority || 'medium');
              if (p === 'high') acc.high += 1; else if (p === 'low') acc.low += 1; else acc.medium += 1;
              return acc;
            },
            { high: 0, medium: 0, low: 0 }
          );
          return (
            <div
              key={String(day)}
              className={`group relative border border-slate-200 dark:border-slate-800 rounded-lg p-2 min-h-[96px] cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => onSelectDate && onSelectDate(day)}
              onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectDate && onSelectDate(day); onOpenAddForDate && onOpenAddForDate(day); }}
              role="button"
              tabIndex={0}
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{format(day, 'EEE, MMM d')}</div>
              {/* Hover summary popover like Month view */}
              {(totalCount > 0 || hasNote) && (
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
              {/* Month-style dots + note indicator */}
              {(totalCount > 0 || hasNote) && (
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                  {hasNote && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" data-tip="Notes present" />
                  )}
                  {(() => {
                    const maxDots = 3;
                    const taskDots = Math.min(maxDots - (hasNote ? 1 : 0), totalCount);
                    return Array.from({ length: taskDots }).map((_, idx) => (
                      <span key={`t-${idx}`} className={`${doneCount === 0 ? 'bg-red-400' : doneCount === totalCount ? 'bg-emerald-500' : 'bg-amber-400'} inline-block w-1.5 h-1.5 rounded-full`} />
                    ));
                  })()}
                  {(() => {
                    const maxDots = 3;
                    const taskDotsShown = Math.min(maxDots - (hasNote ? 1 : 0), totalCount);
                    const overflow = totalCount - taskDotsShown;
                    return overflow > 0 ? (
                      <span className="text-[9px] leading-none text-slate-400 dark:text-slate-500 ml-0.5">+{overflow}</span>
                    ) : null;
                  })()}
                </div>
              )}
              {/* No inline Add link; double-click opens Add Task drawer */}
            </div>
          );
        })}
      </div>
    </section>
  );
}


