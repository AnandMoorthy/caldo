import React from "react";
import { motion } from "framer-motion";
import { Home, CheckSquare, StickyNote, Sparkles, Target, BookOpenText, Settings, ChevronLeft, BarChart3 } from "lucide-react";
import Logo from "./Logo.jsx";

const PAGES = [
  { key: "home", label: "Home", icon: Home },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "journal", label: "Journal", icon: BookOpenText },
  { key: "moments", label: "Moments", icon: Sparkles },
  { key: "habits", label: "Habits", icon: Target },
];

const SIDEBAR_EXPANDED = 224; // w-56
const SIDEBAR_COLLAPSED = 72; // w-[4.5rem]

// Standard app-rail easing (similar to iOS / Linear): no overshoot, same curve both ways
const WIDTH_TRANSITION = { duration: 0.3, ease: [0.32, 0.72, 0, 1] };

function labelTransition(collapsed) {
  // Collapse: hide copy immediately so the rail can clip cleanly.
  // Expand: let width open a beat, then fade labels in.
  return collapsed
    ? { duration: 0.12, ease: [0.4, 0, 1, 1] }
    : { duration: 0.2, delay: 0.08, ease: [0.22, 1, 0.36, 1] };
}

function NavButton({ active, collapsed, label, icon: Icon, onClick, tip }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-tip={collapsed ? tip || label : undefined}
      data-tip-pos="right"
      className={`group flex w-full items-center gap-3 h-10 rounded-xl px-3 text-left text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      }`}
    >
      {/* Icon stays on a fixed rail — no center/left layout swap during collapse */}
      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <Icon size={18} strokeWidth={active ? 2.25 : 2} />
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -4 : 0 }}
        transition={labelTransition(collapsed)}
        className="min-w-0 truncate leading-none whitespace-nowrap"
        aria-hidden={collapsed}
      >
        {label}
      </motion.span>
    </button>
  );
}

export default function Sidebar({ activeTab = "tasks", onChangeTab, collapsed = false, onToggleCollapse }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      transition={WIDTH_TRANSITION}
      className="relative z-10 hidden sm:flex flex-col shrink-0 h-full overflow-hidden border-r border-white/50 dark:border-slate-700/40 bg-white/20 dark:bg-slate-950/25 backdrop-blur-md"
    >
      {/* Brand — logo fixed, copy fades/clips with the rail */}
      <div className="pt-[max(env(safe-area-inset-top),1.25rem)] pb-4 px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Logo className="h-9 w-9 shrink-0" />
          <motion.div
            initial={false}
            animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -6 : 0 }}
            transition={labelTransition(collapsed)}
            className="min-w-0 overflow-hidden"
            aria-hidden={collapsed}
          >
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none whitespace-nowrap">CalDo</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug whitespace-nowrap">Plan. Note. Remember.</p>
          </motion.div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-2" aria-label="Pages">
        {PAGES.map((page) => {
          const isActive = activeTab === page.key || (page.key === "notes" && activeTab === "snippets");
          return (
            <NavButton
              key={page.key}
              active={isActive}
              collapsed={collapsed}
              label={page.label}
              icon={page.icon}
              onClick={() => onChangeTab && onChangeTab(page.key)}
            />
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onToggleCollapse && onToggleCollapse()}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tip-pos="right"
          className="flex w-full items-center gap-3 h-10 rounded-xl px-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {/* One chevron that rotates — avoids icon remount pop on collapse */}
          <motion.span
            initial={false}
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={WIDTH_TRANSITION}
            className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center"
          >
            <ChevronLeft size={18} />
          </motion.span>
          <motion.span
            initial={false}
            animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -4 : 0 }}
            transition={labelTransition(collapsed)}
            className="leading-none whitespace-nowrap"
            aria-hidden={collapsed}
          >
            Collapse
          </motion.span>
        </button>
        <NavButton
          active={activeTab === "overview"}
          collapsed={collapsed}
          label="Overview"
          icon={BarChart3}
          onClick={() => onChangeTab && onChangeTab("overview")}
        />
        <NavButton
          active={activeTab === "settings"}
          collapsed={collapsed}
          label="Settings"
          icon={Settings}
          onClick={() => onChangeTab && onChangeTab("settings")}
        />
      </div>
    </motion.aside>
  );
}
