import React, { useMemo } from "react";
import { startOfYear, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, format, isAfter, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, List, CheckCircle, FileText, Code as CodeIcon } from "lucide-react";

export default function YearView({
  anchorDate,
  onPrevYear,
  onNextYear,
  onToday,
  tasksFor,
  hasNoteFor,
  onSelectMonth,
  snippets = [],
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
    let notesCount = 0; // number of days in this month that have a note
    const prioCount = { high: 0, medium: 0, low: 0 };
    const daySummaries = days.map((d) => {
      const inMonth = isSameMonth(d, monthStartDate);
      const list = tasksFor ? tasksFor(d) : [];
      const doneCount = list.filter((t) => t.done).length;
      const totalCount = list.length;
      if (inMonth) {
        totalTasks += totalCount;
        totalDone += doneCount;
        list.forEach((t) => {
          const p = String(t?.priority || 'medium');
          if (p === 'high') prioCount.high += 1; else if (p === 'low') prioCount.low += 1; else prioCount.medium += 1;
        });
      }
      const hasNote = !!(hasNoteFor && hasNoteFor(d));
      if (inMonth && hasNote) notesCount += 1;
      return { date: d, inMonth, totalCount, doneCount, hasNote };
    });

    const percent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    // Count snippets created within the month
    const monthStartBoundary = startOfMonth(monthStartDate);
    const monthEndBoundary = endOfMonth(monthStartDate);
    let snippetsCount = 0;
    try {
      snippetsCount = Array.isArray(snippets)
        ? snippets.reduce((acc, s) => {
            const raw = s?.createdAt;
            let created;
            if (!raw) return acc;
            try {
              if (typeof raw?.toDate === 'function') created = raw.toDate();
              else if (typeof raw === 'string') created = new Date(raw);
              else if (raw instanceof Date) created = raw;
              else if (typeof raw?.seconds === 'number') created = new Date(raw.seconds * 1000);
            } catch {}
            if (!created || isNaN(created.getTime())) return acc;
            if (created >= monthStartBoundary && created <= monthEndBoundary) return acc + 1;
            return acc;
          }, 0)
        : 0;
    } catch {}

    return { days: daySummaries, totalTasks, totalDone, percent, notesCount, snippetsCount, prioCount };
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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {months.map((m) => {
          const { days, percent, totalTasks, totalDone, notesCount, snippetsCount, prioCount } = computeMonthData(m);
          return (
            <div
              key={String(m)}
              className="group relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 min-h-[clamp(170px,20vh,260px)] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              onClick={() => onSelectMonth && onSelectMonth(m)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg width="36" height="36" viewBox="0 0 40 40" className="-ml-0.5">
                    <circle cx="20" cy="20" r="16" strokeWidth="4" className="text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" />
                    <circle
                      cx="20" cy="20" r="16" strokeWidth="4" fill="none"
                      className="text-indigo-500"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${(1 - (percent || 0) / 100) * (2 * Math.PI * 16)}`}
                      transform="rotate(-90 20 20)"
                    />
                    <text x="20" y="21" textAnchor="middle" fontSize="9" className="fill-slate-600 dark:fill-slate-300">{percent || 0}%</text>
                  </svg>
                  <div className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">{format(m, 'MMMM')}</div>
                </div>
                <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 tabular-nums">{totalDone}/{totalTasks}</div>
              </div>

              {/* Chips */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300"><List size={12} /> {totalTasks}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[11px] text-emerald-700 dark:text-emerald-300"><CheckCircle size={12} /> {totalDone}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[11px] text-blue-700 dark:text-blue-300"><FileText size={12} /> {notesCount}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-[11px] text-purple-700 dark:text-purple-300"><CodeIcon size={12} /> {snippetsCount}</span>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {days.map((d, idx) => {
                  const isFutureDate = isAfter(d.date, startOfDay(new Date()));
                  const color = !d.inMonth
                    ? "bg-transparent"
                    : d.totalCount === 0
                      ? (d.hasNote ? "bg-blue-500/50" : "bg-slate-200 dark:bg-slate-700")
                      : isFutureDate
                        ? "bg-slate-400"
                        : d.doneCount === 0
                          ? "bg-red-400"
                          : d.doneCount === d.totalCount
                            ? "bg-emerald-500"
                            : "bg-amber-400";
                  return (
                    <span
                      key={idx}
                      className={`inline-block w-[9px] h-[9px] rounded ${color}`}
                      title={`${format(d.date, 'MMM d')}: ${d.doneCount}/${d.totalCount}${d.hasNote ? ' + note' : ''}`}
                    />
                  );
                })}
              </div>

              {/* Hover popover with richer details */}
              <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-30">
                <div className="opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 ease-out">
                  <div className="w-64 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{format(m, 'MMMM yyyy')}</div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="inline-flex items-center gap-1"><List size={12} /> Tasks: <span className="font-medium text-slate-800 dark:text-slate-200">{totalTasks}</span></div>
                      <div className="inline-flex items-center gap-1"><CheckCircle size={12} /> Done: <span className="font-medium text-slate-800 dark:text-slate-200">{totalDone}</span></div>
                      <div className="inline-flex items-center gap-1"><FileText size={12} /> Notes: <span className="font-medium text-slate-800 dark:text-slate-200">{notesCount}</span></div>
                      <div className="inline-flex items-center gap-1"><CodeIcon size={12} /> Snippets: <span className="font-medium text-slate-800 dark:text-slate-200">{snippetsCount}</span></div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {prioCount.high} high</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {prioCount.medium} med</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {prioCount.low} low</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


