import React, { useMemo } from "react";
import { startOfYear, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function YearView({
  anchorDate,
  onPrevYear,
  onNextYear,
  onToday,
  tasksFor,
  hasNoteFor,
  onSelectMonth,
}) {
  const yearStart = useMemo(() => startOfYear(anchorDate || new Date()), [anchorDate]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, idx) => startOfMonth(addMonths(yearStart, idx)));
  }, [yearStart]);

  function computeMonthData(monthStartDate) {
    const start = startOfWeek(startOfMonth(monthStartDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthStartDate), { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    let totalTasks = 0;
    let totalDone = 0;
    const daySummaries = days.map((d) => {
      const inMonth = isSameMonth(d, monthStartDate);
      const list = tasksFor ? tasksFor(d) : [];
      const doneCount = list.filter((t) => t.done).length;
      const totalCount = list.length;
      if (inMonth) {
        totalTasks += totalCount;
        totalDone += doneCount;
      }
      const hasNote = !!(hasNoteFor && hasNoteFor(d));
      return { date: d, inMonth, totalCount, doneCount, hasNote };
    });

    const percent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    return { days: daySummaries, totalTasks, totalDone, percent };
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onPrevYear} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Previous year" data-tip="Previous year"><ChevronLeft size={16} /></button>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 w-32 text-center select-none">{format(yearStart, 'yyyy')}</div>
          <button onClick={onNextYear} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="Next year" data-tip="Next year"><ChevronRight size={16} /></button>
        </div>
        <button onClick={onToday} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800" aria-label="This year" data-tip="This year"><Calendar size={16} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {months.map((m) => {
          const { days, percent, totalTasks, totalDone } = computeMonthData(m);
          return (
            <div
              key={String(m)}
              className="group border border-slate-200 dark:border-slate-800 rounded-xl p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              onClick={() => onSelectMonth && onSelectMonth(m)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{format(m, 'MMMM')}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{totalDone}/{totalTasks} ({percent}%)</div>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-7 gap-0.5">
                {days.map((d, idx) => {
                  const color = !d.inMonth
                    ? "bg-transparent"
                    : d.totalCount === 0
                      ? (d.hasNote ? "bg-blue-500/50" : "bg-slate-200 dark:bg-slate-700")
                      : d.doneCount === 0
                        ? "bg-red-400"
                        : d.doneCount === d.totalCount
                          ? "bg-emerald-500"
                          : "bg-amber-400";
                  return (
                    <span
                      key={idx}
                      className={`inline-block w-2 h-2 rounded ${color}`}
                      title={`${format(d.date, 'MMM d')}: ${d.doneCount}/${d.totalCount}${d.hasNote ? ' + note' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


