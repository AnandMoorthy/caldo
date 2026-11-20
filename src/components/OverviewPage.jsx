import React, { useEffect, useMemo, useState } from "react";
import { addMonths, format, isSameMonth, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import {
  BookOpenText,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import {
  JOURNAL_MOODS,
  MOMENT_MOODS,
  buildPeriodOverview,
} from "../utils/periodOverview";
import PeriodTaskBars from "./PeriodTaskBars.jsx";

function RangeToggle({ value, onChange }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90"
      role="tablist"
      aria-label="Overview range"
    >
      {[
        { id: "week", label: "Week" },
        { id: "month", label: "Month" },
      ].map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`min-h-[40px] min-w-[4.5rem] rounded-xl px-3.5 text-xs font-semibold transition touch-manipulation ${
              active
                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MonthChooser({ monthDate, onPrev, onNext, onThisMonth }) {
  const isCurrentMonth = isSameMonth(monthDate, new Date());
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 touch-manipulation"
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[8.5rem] text-center text-xs font-semibold text-slate-800 dark:text-slate-100">
        {format(monthDate, "MMMM yyyy")}
      </span>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 touch-manipulation"
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={onThisMonth}
          className="ml-0.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 touch-manipulation"
        >
          This month
        </button>
      )}
    </div>
  );
}

function SummaryChip({ icon: Icon, value, label, accent, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex min-w-[7rem] flex-1 flex-col items-start rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition dark:bg-slate-900/70 dark:ring-slate-700/70 ${
        onClick ? "hover:-translate-y-0.5 hover:shadow-md touch-manipulation" : ""
      }`}
    >
      <span className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${accent}`}>
        <Icon size={15} />
      </span>
      <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</span>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </Comp>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-800">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyLine({ children }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}

function MoodBars({ counts, catalog }) {
  const entries = catalog
    .map((mood) => ({ ...mood, count: counts[mood.id] || 0 }))
    .filter((mood) => mood.count > 0);
  const max = entries.reduce((n, mood) => Math.max(n, mood.count), 0);

  if (entries.length === 0) {
    return <EmptyLine>No moods logged in this period.</EmptyLine>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((mood) => (
        <li key={mood.id} className="flex items-center gap-3">
          <span className="w-20 shrink-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            {mood.label}
          </span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500/80 dark:bg-indigo-400/70"
              style={{ width: `${max > 0 ? Math.max(8, (mood.count / max) * 100) : 0}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
            {mood.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function OverviewPage({
  tasksMap = {},
  habits = [],
  journals = [],
  moments = [],
  streak = null,
  onChangeTab,
  onOpenToday,
  onOpenJournal,
  onMonthChange,
}) {
  const [range, setRange] = useState("week");
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    if (range !== "month") return;
    onMonthChange && onMonthChange(monthDate);
    // Parent callback identity is not stable; only react to the selected month.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, monthDate]);

  const overview = useMemo(
    () =>
      buildPeriodOverview({
        range,
        today: range === "month" ? monthDate : new Date(),
        tasksMap,
        habits,
        journals,
        moments,
        streak,
      }),
    [range, monthDate, tasksMap, habits, journals, moments, streak]
  );

  const hasHabits = overview.habits.habitCount > 0;

  return (
    <main className="relative w-full min-w-0 px-3 pb-10 sm:px-5 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto w-full max-w-6xl"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{overview.label}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              Overview
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              How this {range} is going across tasks, habits, journal, and moments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RangeToggle value={range} onChange={setRange} />
            {range === "month" && (
              <MonthChooser
                monthDate={monthDate}
                onPrev={() => setMonthDate((prev) => startOfMonth(addMonths(prev, -1)))}
                onNext={() => setMonthDate((prev) => startOfMonth(addMonths(prev, 1)))}
                onThisMonth={() => setMonthDate(startOfMonth(new Date()))}
              />
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <SummaryChip
            icon={CheckSquare}
            value={`${overview.tasks.done}/${overview.tasks.total}`}
            label={`Tasks · ${overview.tasks.percent}%`}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            onClick={() => onOpenToday && onOpenToday()}
          />
          <SummaryChip
            icon={Flame}
            value={overview.streakCurrent}
            label="Streak"
            accent="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          />
          {hasHabits && (
            <SummaryChip
              icon={Target}
              value={`${overview.habits.rate}%`}
              label="Habits"
              accent="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              onClick={() => onChangeTab && onChangeTab("habits")}
            />
          )}
          <SummaryChip
            icon={BookOpenText}
            value={overview.journals.daysWritten}
            label="Journal days"
            accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
            onClick={() => onOpenJournal && onOpenJournal()}
          />
          <SummaryChip
            icon={Sparkles}
            value={overview.moments.count}
            label="Moments"
            accent="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
            onClick={() => onChangeTab && onChangeTab("moments")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Panel
              title="Tasks"
              action={
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {overview.tasks.done}/{overview.tasks.total} done
                </span>
              }
            >
              <PeriodTaskBars byDay={overview.tasks.byDay} range={range} heightClass="h-40" />
            </Panel>
          </div>

          {hasHabits && (
            <Panel
              title="Habits"
              action={
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {overview.habits.checkIns}/{overview.habits.possible} check-ins
                </span>
              }
            >
              {overview.habits.byHabit.length === 0 ? (
                <EmptyLine>No habits yet.</EmptyLine>
              ) : (
                <ul className="space-y-3">
                  {overview.habits.byHabit.map((habit) => (
                    <li key={habit.id}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {habit.title}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {habit.hits}/{habit.days} · {habit.rate}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-500/80 dark:bg-amber-400/70"
                          style={{ width: `${habit.rate}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel
            title="Journal"
            action={
              overview.journals.avgEnergy != null ? (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Avg energy {overview.journals.avgEnergy}/5
                </span>
              ) : null
            }
          >
            {overview.journals.daysWritten === 0 ? (
              <EmptyLine>No journal entries in this period.</EmptyLine>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {overview.journals.daysWritten} day
                  {overview.journals.daysWritten === 1 ? "" : "s"} written
                  {overview.journals.avgEnergy != null
                    ? ` · average energy ${overview.journals.avgEnergy}/5`
                    : ""}
                </p>
                <MoodBars counts={overview.journals.moodCounts} catalog={JOURNAL_MOODS} />
              </div>
            )}
          </Panel>

          <Panel
            title="Moments"
            action={
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {overview.moments.count} logged
              </span>
            }
          >
            {overview.moments.count === 0 ? (
              <EmptyLine>No moments in this period.</EmptyLine>
            ) : (
              <MoodBars counts={overview.moments.moodCounts} catalog={MOMENT_MOODS} />
            )}
          </Panel>
        </div>
      </motion.div>
    </main>
  );
}
