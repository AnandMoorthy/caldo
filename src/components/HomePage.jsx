import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Home,
  CheckSquare,
  StickyNote,
  BookOpenText,
  Sparkles,
  Target,
  Flame,
  Plus,
  ChevronRight,
  HelpCircle,
  LogIn,
  Circle,
} from "lucide-react";
import Logo from "./Logo.jsx";

const PILLARS = [
  {
    key: "tasks",
    label: "Tasks",
    blurb: "Plan your day with calendar views, priorities, and recurring work.",
    icon: CheckSquare,
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    key: "notes",
    label: "Notes",
    blurb: "Reusable rich-text notes you can pin, copy, and share.",
    icon: StickyNote,
    tint: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    needsSignIn: true,
  },
  {
    key: "journal",
    label: "Journal",
    blurb: "One entry per day with mood, energy, and a gentle reminder.",
    icon: BookOpenText,
    tint: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    needsSignIn: true,
  },
  {
    key: "moments",
    label: "Moments",
    blurb: "Short mood-tagged posts organized by category.",
    icon: Sparkles,
    tint: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    needsSignIn: true,
  },
  {
    key: "habits",
    label: "Habits",
    blurb: "Track daily habits with a rolling seven-day history.",
    icon: Target,
    tint: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
];

function PillarList({ onChangeTab, user, onSignIn }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {PILLARS.map(({ key, label, blurb, icon: Icon, tint, needsSignIn }) => (
        <li key={key}>
          <button
            type="button"
            onClick={() => {
              if (needsSignIn && !user) {
                onSignIn && onSignIn();
                return;
              }
              onChangeTab && onChangeTab(key);
            }}
            className="group flex w-full items-start gap-3 py-3.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 -mx-1 px-1 rounded-xl"
          >
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>
              <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
                {needsSignIn && !user && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Sign in
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{blurb}</span>
            </span>
            <ChevronRight
              size={16}
              className="mt-1.5 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function WelcomeView({ user, onChangeTab, onSignIn, onOpenHelp, onStartToday }) {
  return (
    <div className="space-y-8">
      <div className="pt-2 sm:pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
              CalDo
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Plan. Note. Remember.</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl text-base leading-relaxed">
          Your local-first calendar for tasks, notes, journal, moments, and habits—optionally synced when you sign in.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStartToday && onStartToday()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 touch-manipulation"
          >
            <Plus size={16} />
            Start today
          </button>
          {!user && (
            <button
              type="button"
              onClick={() => onSignIn && onSignIn()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 touch-manipulation"
            >
              <LogIn size={16} />
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenHelp && onOpenHelp()}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 touch-manipulation"
          >
            <HelpCircle size={16} />
            Full guide
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Explore
        </h2>
        <PillarList onChangeTab={onChangeTab} user={user} onSignIn={onSignIn} />
      </section>
    </div>
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
  onOpenHelp,
  onAddTask,
  onOpenToday,
  onOpenJournal,
  onSelectTask,
}) {
  const [showExplore, setShowExplore] = useState(false);
  const remaining = Math.max(0, taskTotal - taskDone);

  return (
    <div className="space-y-6">
      <div className="pt-1 sm:pt-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{todayLabel}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {user?.displayName ? `Hi, ${user.displayName.split(" ")[0]}` : "Today"}
        </h1>
        <p className="mt-1.5 text-slate-600 dark:text-slate-300 text-sm">
          {taskTotal === 0
            ? "No tasks yet—add one to start your day."
            : remaining === 0
              ? "All tasks done. Nice work."
              : `${remaining} task${remaining === 1 ? "" : "s"} left · ${taskDone}/${taskTotal} done`}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <button
          type="button"
          onClick={() => onOpenToday && onOpenToday()}
          className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <CheckSquare size={15} className="text-slate-400" />
          <span className="font-medium">{taskDone}/{taskTotal}</span>
          <span className="text-slate-500 dark:text-slate-400">tasks</span>
        </button>
        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
          <Flame size={15} className="text-orange-500" />
          <span className="font-medium">{streakCurrent || 0}</span>
          <span className="text-slate-500 dark:text-slate-400">streak</span>
        </span>
        <button
          type="button"
          onClick={() => onChangeTab && onChangeTab("habits")}
          className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Target size={15} className="text-slate-400" />
          <span className="font-medium">{habitsDone}/{habitsTotal}</span>
          <span className="text-slate-500 dark:text-slate-400">habits</span>
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
          className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <BookOpenText size={15} className="text-slate-400" />
          <span className="font-medium">
            {!user ? "—" : journalToday ? "Written" : "Not yet"}
          </span>
          <span className="text-slate-500 dark:text-slate-400">journal</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAddTask && onAddTask()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 touch-manipulation"
        >
          <Plus size={15} />
          Add task
        </button>
        <button
          type="button"
          onClick={() => onOpenToday && onOpenToday()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 touch-manipulation"
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
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 touch-manipulation"
        >
          {user ? "Write journal" : "Sign in to journal"}
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Remaining today
          </h2>
          {incompleteTasks.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenToday && onOpenToday()}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all
            </button>
          )}
        </div>
        {incompleteTasks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            {taskTotal === 0 ? "Nothing planned yet." : "Everything for today is checked off."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {incompleteTasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onSelectTask && onSelectTask(task)}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 -mx-1 px-1 rounded-lg"
                >
                  <Circle size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                    {task.title || "Untitled"}
                  </span>
                  {task.priority === "high" && (
                    <span className="text-[10px] font-semibold uppercase text-rose-500">High</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => setShowExplore((v) => !v)}
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          aria-expanded={showExplore}
        >
          {showExplore ? "Hide explore" : "New here? Explore CalDo"}
        </button>
        {showExplore && (
          <div className="mt-3">
            <PillarList onChangeTab={onChangeTab} user={user} onSignIn={onSignIn} />
            <button
              type="button"
              onClick={() => onOpenHelp && onOpenHelp()}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <HelpCircle size={14} />
              Full guide
            </button>
          </div>
        )}
      </div>
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
  onOpenHelp,
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
    <main className="w-full max-w-2xl mx-auto pb-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 sm:p-6 border border-transparent dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-slate-500 sm:hidden">
          <Home size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Home</span>
        </div>
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
            onOpenHelp={onOpenHelp}
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
            onOpenHelp={onOpenHelp}
            onStartToday={onStartToday}
          />
        )}
      </div>
    </main>
  );
}
