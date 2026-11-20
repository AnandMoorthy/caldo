import React from "react";
import { format, isSameDay, parseISO } from "date-fns";

export default function PeriodTaskBars({ byDay = [], range = "week", heightClass = "h-36" }) {
  const max = byDay.reduce((n, day) => Math.max(n, day.total), 0);
  const today = new Date();

  if (max === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No tasks scheduled in this period.</p>;
  }

  return (
    <div className={`flex items-end gap-1 sm:gap-1.5 ${heightClass}`}>
      {byDay.map((day) => {
        const date = parseISO(day.key);
        const height = day.total > 0 ? Math.max(10, Math.round((day.total / max) * 100)) : 4;
        const doneHeight = day.total > 0 ? Math.round((day.done / day.total) * height) : 0;
        const isToday = isSameDay(date, today);
        return (
          <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div
              className="relative flex w-full max-w-[1.75rem] items-end justify-center"
              style={{ height: range === "month" ? "7.5rem" : "6.5rem" }}
              title={`${format(date, "MMM d")}: ${day.done}/${day.total} done`}
            >
              <div
                className={`relative w-full overflow-hidden rounded-t-md ${
                  day.total === 0
                    ? "bg-slate-200/60 dark:bg-slate-800/60"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
                style={{ height: `${height}%` }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-emerald-500/80 dark:bg-emerald-400/70"
                  style={{ height: `${doneHeight}%` }}
                />
              </div>
            </div>
            <span
              className={`text-[10px] font-medium ${
                isToday
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {range === "month" ? format(date, "d") : format(date, "EEEEE")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
