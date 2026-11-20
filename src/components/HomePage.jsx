import React, { useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CheckSquare,
  StickyNote,
  BookOpenText,
  Sparkles,
  Target,
  Flame,
  Plus,
  ChevronRight,
  LogIn,
  Circle,
  ArrowRight,
} from "lucide-react";
import Logo from "./Logo.jsx";

const PILLARS = [
  {
    key: "tasks",
    label: "Tasks & Calendar",
    blurb: "Day, week, month, and year views with priorities, subtasks, and recurring work.",
    icon: CheckSquare,
    tint: "bg-emerald-500",
    soft: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "notes",
    label: "Notes",
    blurb: "Reusable rich-text notes you can pin, copy, and share with a link.",
    icon: StickyNote,
    tint: "bg-indigo-500",
    soft: "bg-indigo-50 dark:bg-indigo-950/40",
    needsSignIn: true,
  },
  {
    key: "journal",
    label: "Journal",
    blurb: "One entry a day with mood, energy, and a gentle reminder when you need it.",
    icon: BookOpenText,
    tint: "bg-cyan-500",
    soft: "bg-cyan-50 dark:bg-cyan-950/40",
    needsSignIn: true,
  },
  {
    key: "moments",
    label: "Moments",
    blurb: "Short mood-tagged posts, organized by the categories you care about.",
    icon: Sparkles,
    tint: "bg-pink-500",
    soft: "bg-pink-50 dark:bg-pink-950/40",
    needsSignIn: true,
  },
  {
    key: "habits",
    label: "Habits",
    blurb: "A rolling seven-day tracker so small routines stay visible.",
    icon: Target,
    tint: "bg-amber-500",
    soft: "bg-amber-50 dark:bg-amber-950/40",
  },
];

function openPillar(pillar, { user, onChangeTab, onSignIn }) {
  if (pillar.needsSignIn && !user) {
    onSignIn && onSignIn();
    return;
  }
  onChangeTab && onChangeTab(pillar.key);
}

/** Full-bleed color mesh used behind Home header + content. */
export function HomeMeshBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#f4f6fb] dark:bg-slate-950" />
      <div className="absolute -left-[20%] -top-[10%] h-[70%] w-[70%] rounded-full bg-indigo-300/40 blur-[100px] dark:bg-indigo-600/20" />
      <div className="absolute -right-[15%] top-[5%] h-[55%] w-[55%] rounded-full bg-sky-300/35 blur-[110px] dark:bg-sky-600/15" />
      <div className="absolute bottom-[-10%] left-[15%] h-[50%] w-[60%] rounded-full bg-violet-200/40 blur-[120px] dark:bg-violet-700/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/70 dark:via-slate-950/20 dark:to-slate-950/70" />
    </div>
  );
}

function ProductPeek() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="relative mx-auto w-full max-w-4xl px-2 sm:px-4">
      <div className="overflow-hidden rounded-t-2xl border border-b-0 border-slate-200/80 bg-white/95 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs font-medium text-slate-400">Today · CalDo</span>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5.5rem_1fr]">
          <div className="space-y-3 border-r border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            {["Tasks", "Notes", "Journal", "Habits"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded-lg ${i === 0 ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-200 dark:bg-slate-700"}`} />
                <span className={`hidden text-[10px] font-medium sm:inline ${i === 0 ? "text-slate-800 dark:text-slate-100" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 sm:p-4">
            <div className="mb-3 flex gap-1.5">
              {days.map((d, i) => (
                <div
                  key={`${d}-${i}`}
                  className={`flex h-9 flex-1 flex-col items-center justify-center rounded-lg text-[10px] font-semibold ${
                    i === 4
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-50 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500"
                  }`}
                >
                  <span>{d}</span>
                  <span className="text-[11px]">{12 + i}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { title: "Ship home landing", done: false, accent: "border-l-indigo-500" },
                { title: "Morning stretch", done: true, accent: "border-l-emerald-500" },
                { title: "Write journal", done: false, accent: "border-l-cyan-500" },
              ].map((row) => (
                <div
                  key={row.title}
                  className={`flex items-center gap-3 rounded-xl border border-slate-100 border-l-4 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40 ${row.accent}`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      row.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {row.done ? <span className="text-[9px] leading-none">✓</span> : null}
                  </span>
                  <span className={`text-sm ${row.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                    {row.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50/95 to-transparent dark:from-slate-950/90" />
    </div>
  );
}

function PillarGrid({ user, onChangeTab, onSignIn }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PILLARS.map((pillar) => {
        const Icon = pillar.icon;
        return (
          <button
            key={pillar.key}
            type="button"
            onClick={() => openPillar(pillar, { user, onChangeTab, onSignIn })}
            className={`group flex flex-col items-start rounded-2xl p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 ${pillar.soft}`}
          >
            <span className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-white ${pillar.tint}`}>
              <Icon size={18} />
            </span>
            <span className="flex w-full items-center gap-2">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{pillar.label}</span>
              {pillar.needsSignIn && !user && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sign in</span>
              )}
              <ChevronRight
                size={16}
                className="ml-auto text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600"
              />
            </span>
            <span className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{pillar.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}

function WelcomeView({ user, onChangeTab, onSignIn, onStartToday }) {
  return (
    <div className="relative">
      <section className="relative flex min-h-[calc(100dvh-6.5rem)] flex-col px-1 pt-4 text-center sm:min-h-[calc(100dvh-5.5rem)] sm:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center pb-6 pt-2"
        >
          <div className="mb-5 flex items-center gap-3">
            <Logo className="h-11 w-11 sm:h-12 sm:w-12" />
            <div className="text-left">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">CalDo</div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">Plan. Note. Remember.</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl md:text-6xl md:leading-[1.05]">
            The homepage for your day
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            One place to manage your day: tasks, notes, journal, moments, and habits, all together.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onStartToday && onStartToday()}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 touch-manipulation"
            >
              <Plus size={16} />
              Start today
            </button>
            {!user && (
              <button
                type="button"
                onClick={() => onSignIn && onSignIn()}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 touch-manipulation"
              >
                <LogIn size={16} />
                Sign in
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
          className="relative z-10 mt-auto w-full"
        >
          <ProductPeek />
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-1 pb-6 pt-10 sm:pb-10 sm:pt-14">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Everything in one place
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Open any part of CalDo, or sign in to keep notes, journal, and moments with you.
          </p>
        </div>
        <PillarGrid user={user} onChangeTab={onChangeTab} onSignIn={onSignIn} />
      </section>

      <section className="relative z-10 mx-auto mb-8 w-full max-w-6xl px-1 pb-10 sm:mb-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-slate-900 px-6 py-8 text-left text-white dark:bg-slate-100 dark:text-slate-900 sm:flex-row sm:items-center sm:px-10 sm:py-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready when you are</h2>
            <p className="mt-2 text-sm text-slate-300 dark:text-slate-600 sm:text-base">
              Add your first task for today, or sign in to pick up where you left off.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onStartToday && onStartToday()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white hover:bg-indigo-400 dark:bg-indigo-600 dark:hover:bg-indigo-500 touch-manipulation"
            >
              Start today
              <ArrowRight size={16} />
            </button>
            {!user && (
              <button
                type="button"
                onClick={() => onSignIn && onSignIn()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/15 dark:bg-slate-900/10 dark:text-slate-900 dark:hover:bg-slate-900/15 touch-manipulation"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatChip({ icon: Icon, value, label, onClick, accent }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex min-w-[7.5rem] flex-1 flex-col items-start rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition dark:bg-slate-900/70 dark:ring-slate-700/70 ${
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

function GistView({
  user,
  todayLabel,
  taskTotal,
  taskDone,
  incompleteTasks,
  streakCurrent,
  habitsTotal,
  habitsDone,
  journalToday,
  onChangeTab,
  onSignIn,
  onAddTask,
  onOpenToday,
  onOpenJournal,
  onSelectTask,
}) {
  const remaining = Math.max(0, taskTotal - taskDone);
  const progress = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

  return (
    <div className="relative pb-10">
      <section className="relative px-1 pb-8 pt-4 sm:px-2 sm:pb-10 sm:pt-6">
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{todayLabel}</p>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
                  {user?.displayName ? `Hi, ${user.displayName.split(" ")[0]}` : "Today"}
                </h1>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                  {taskTotal === 0
                    ? "No tasks yet. Add one to start shaping the day."
                    : remaining === 0
                      ? "All tasks done. Nice work."
                      : `${remaining} task${remaining === 1 ? "" : "s"} left · ${taskDone}/${taskTotal} done`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onAddTask && onAddTask()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 touch-manipulation"
                >
                  <Plus size={16} />
                  Add task
                </button>
                <button
                  type="button"
                  onClick={() => onOpenToday && onOpenToday()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 text-sm font-semibold text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 touch-manipulation"
                >
                  Open today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      onSignIn && onSignIn();
                      return;
                    }
                    onOpenJournal && onOpenJournal();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 text-sm font-semibold text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 touch-manipulation"
                >
                  {user ? "Write journal" : "Sign in to journal"}
                </button>
              </div>
            </div>

            {taskTotal > 0 && (
              <div className="mt-6 max-w-xl">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <StatChip
                icon={CheckSquare}
                value={`${taskDone}/${taskTotal}`}
                label="Tasks"
                accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                onClick={() => onOpenToday && onOpenToday()}
              />
              <StatChip
                icon={Flame}
                value={streakCurrent || 0}
                label="Streak"
                accent="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              />
              <StatChip
                icon={Target}
                value={`${habitsDone}/${habitsTotal}`}
                label="Habits"
                accent="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                onClick={() => onChangeTab && onChangeTab("habits")}
              />
              <StatChip
                icon={BookOpenText}
                value={!user ? "-" : journalToday ? "Done" : "Open"}
                label="Journal"
                accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                onClick={() => {
                  if (!user) {
                    onSignIn && onSignIn();
                    return;
                  }
                  onOpenJournal && onOpenJournal();
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-1 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Remaining today</h2>
            {incompleteTasks.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenToday && onOpenToday()}
                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View all
              </button>
            )}
          </div>
          {incompleteTasks.length === 0 ? (
            <p className="rounded-2xl bg-white/60 px-4 py-8 text-sm text-slate-500 ring-1 ring-slate-200/70 dark:bg-slate-900/50 dark:text-slate-400 dark:ring-slate-800">
              {taskTotal === 0 ? "Nothing planned yet. Add a task to fill this space." : "Everything for today is checked off."}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl bg-white/70 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
              {incompleteTasks.slice(0, 8).map((task, index) => (
                <li key={task.id} className={index > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}>
                  <button
                    type="button"
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <Circle size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {task.title || "Untitled"}
                    </span>
                    {task.priority === "high" && (
                      <span className="text-[10px] font-semibold uppercase text-rose-500">High</span>
                    )}
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick jumps</h2>
            <div className="mt-3 space-y-1">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <button
                    key={pillar.key}
                    type="button"
                    onClick={() => openPillar(pillar, { user, onChangeTab, onSignIn })}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white ${pillar.tint}`}>
                      <Icon size={14} />
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{pillar.label}</span>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage({
  user = null,
  todayTasks = [],
  streak = null,
  habits = [],
  journalToday = null,
  hasAnyData = false,
  onChangeTab,
  onSignIn,
  onAddTask,
  onOpenToday,
  onStartToday,
  onOpenJournal,
  onSelectTask,
}) {
  const todayLabel = format(new Date(), "EEEE, MMMM d");
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const taskTotal = todayTasks.length;
  const taskDone = todayTasks.filter((t) => !!t.done).length;
  const incompleteTasks = useMemo(
    () => todayTasks.filter((t) => !t.done),
    [todayTasks]
  );

  const habitsTotal = Array.isArray(habits) ? habits.length : 0;
  const habitsDone = Array.isArray(habits)
    ? habits.filter((h) => !!h?.history?.[todayKey]).length
    : 0;

  const showGist = !!user || hasAnyData;

  return (
    <main className="relative min-h-full w-full min-w-0 px-3 sm:px-5 md:px-8">
      {showGist ? (
        <GistView
          user={user}
          todayLabel={todayLabel}
          taskTotal={taskTotal}
          taskDone={taskDone}
          incompleteTasks={incompleteTasks}
          streakCurrent={streak?.current || 0}
          habitsTotal={habitsTotal}
          habitsDone={habitsDone}
          journalToday={journalToday}
          onChangeTab={onChangeTab}
          onSignIn={onSignIn}
          onAddTask={onAddTask}
          onOpenToday={onOpenToday}
          onOpenJournal={onOpenJournal}
          onSelectTask={onSelectTask}
        />
      ) : (
        <WelcomeView
          user={user}
          onChangeTab={onChangeTab}
          onSignIn={onSignIn}
          onStartToday={onStartToday}
        />
      )}
    </main>
  );
}
