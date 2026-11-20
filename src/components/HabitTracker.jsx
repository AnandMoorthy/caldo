import React, { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import PageSectionHeader from "./PageSectionHeader.jsx";

const NEW_BUTTON_CLASS =
  "shrink-0 inline-flex items-center justify-center gap-1 h-9 px-3 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 touch-manipulation";

export default function HabitTracker({ habits = [], onAddHabit, onToggleHabitForDay, onDeleteHabit }) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const dayScrollerRef = useRef(null);
  const dayButtonRefs = useRef({});

  const recentDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(new Date(), index - 6);
      const key = format(day, "yyyy-MM-dd");
      return {
        key,
        shortDay: format(day, "EEE"),
        dayNumber: format(day, "d"),
      };
    });
  }, []);

  const completionSummary = useMemo(() => {
    const total = habits.length;
    const completed = habits.filter((habit) => !!habit?.history?.[selectedDateKey]).length;
    return { total, completed };
  }, [habits, selectedDateKey]);

  useEffect(() => {
    const activeKey = selectedDateKey || todayKey;
    const scroller = dayScrollerRef.current;
    if (!scroller) return;

    const frame = requestAnimationFrame(() => {
      const button = dayButtonRefs.current[activeKey];
      if (!button) return;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const target = buttonLeft - (scroller.clientWidth - buttonWidth) / 2;
      scroller.scrollTo({
        left: Math.max(0, Math.min(target, scroller.scrollWidth - scroller.clientWidth)),
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedDateKey, todayKey, recentDays]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddHabit && onAddHabit(trimmed);
    setTitle("");
    setAdding(false);
  }

  function handleCancelAdd() {
    setTitle("");
    setAdding(false);
  }

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
        <PageSectionHeader
          eyebrow={`${completionSummary.completed}/${completionSummary.total} today`}
          title="Habits"
          actions={
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={NEW_BUTTON_CLASS}
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          }
        >

          {adding && (
            <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a new habit (e.g. Drink water)"
                autoFocus
                className="w-full min-w-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={handleCancelAdd}
                className="shrink-0 h-9 px-2.5 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="shrink-0 inline-flex items-center justify-center h-9 px-3 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 touch-manipulation"
              >
                Add
              </button>
            </form>
          )}
        </PageSectionHeader>

        <div className="mb-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">History (last 7 days)</div>
          <div ref={dayScrollerRef} className="flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth">
            {recentDays.map((day) => {
              const active = selectedDateKey === day.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  ref={(el) => {
                    if (el) dayButtonRefs.current[day.key] = el;
                    else delete dayButtonRefs.current[day.key];
                  }}
                  onClick={() => setSelectedDateKey(day.key)}
                  className={`flex-shrink-0 rounded-xl border px-3 py-2 min-w-[56px] min-h-[44px] text-center ${
                    active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide">{day.shortDay}</div>
                  <div className="text-sm font-semibold">{day.dayNumber}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            {selectedDateKey === todayKey ? "Today" : "Selected day"} ({format(new Date(selectedDateKey), "EEE, MMM d")})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{habits.length} habits</span>
        </div>

        {habits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 sm:p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No habits yet. Tap New to add your first habit.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {habits.map((habit) => {
              const completed = !!habit?.history?.[selectedDateKey];
              return (
                <li
                  key={habit.id}
                  className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3"
                >
                  <button
                    type="button"
                    onClick={() => onToggleHabitForDay && onToggleHabitForDay(habit.id, selectedDateKey)}
                    className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-indigo-600 dark:text-indigo-400 active:scale-95"
                    aria-label={completed ? `Mark ${habit.title} as not completed` : `Mark ${habit.title} as completed`}
                  >
                    {completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base truncate ${completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"}`}>
                      {habit.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {recentDays.map((day) => {
                        const done = !!habit?.history?.[day.key];
                        return (
                          <span
                            key={`${habit.id}-${day.key}`}
                            className={`inline-block w-2 h-2 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                            title={`${day.shortDay} ${day.dayNumber}: ${done ? "Done" : "Not done"}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteHabit && onDeleteHabit(habit.id)}
                    className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 active:scale-95"
                    aria-label={`Delete habit ${habit.title}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
