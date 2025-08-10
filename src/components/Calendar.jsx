import React from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar({
  monthStart,
  monthDays,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  tasksFor,
  onOpenAddModal,
  dragOverDayKey,
  setDragOverDayKey,
  onDropTaskOnDay,
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
              className={`border border-slate-200 dark:border-slate-800 rounded-lg p-1 sm:p-2 min-h-[56px] sm:min-h-[88px] cursor-pointer relative ${baseBg} ${selectedBg} ${ringClass}`}
            >
              <div className="flex items-start justify-between">
                <div className={isSelected ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 text-white text-[11px] sm:text-xs flex items-center justify-center font-semibold" : "text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"}>
                  {format(day, "d")}
                </div>
                <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500">{format(day, "MMM")}</div>
              </div>
              {tasks.length > 0 && (
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5" title={`${doneCount}/${tasks.length} done`}>
                  {Array.from({ length: Math.min(3, tasks.length) }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`${doneCount === 0 ? "bg-red-400" : doneCount === tasks.length ? "bg-green-500" : "bg-amber-400"} inline-block w-1.5 h-1.5 rounded-full`}
                    />
                  ))}
                  {tasks.length > 3 && <span className="text-[9px] leading-none text-slate-400 dark:text-slate-500 ml-0.5">+{tasks.length - 3}</span>}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}


