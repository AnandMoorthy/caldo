import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, StickyNote, Sparkles, Target, BookOpenText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Logo from "./Logo.jsx";

const PAGES = [
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "journal", label: "Journal", icon: BookOpenText },
  { key: "moments", label: "Moments", icon: Sparkles },
  { key: "habits", label: "Habits", icon: Target },
];

const SIDEBAR_EXPANDED = 224; // w-56
const SIDEBAR_COLLAPSED = 72; // w-[4.5rem]
const WIDTH_TRANSITION = { type: "spring", stiffness: 320, damping: 32, mass: 0.85 };
const LABEL_TRANSITION = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };

function NavButton({ active, collapsed, label, icon: Icon, onClick, tip }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-tip={collapsed ? tip || label : undefined}
      data-tip-pos="right"
      className={`group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150 overflow-hidden ${
        collapsed ? "justify-center h-10 w-10" : "w-full gap-3 px-3 py-2.5 text-left"
      } ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 2} className="shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={LABEL_TRANSITION}
            className="truncate leading-none whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Sidebar({ activeTab = "tasks", onChangeTab, collapsed = false, onToggleCollapse }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      transition={WIDTH_TRANSITION}
      className="hidden sm:flex flex-col shrink-0 h-full overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
    >
      {/* Brand block — logo + title + subtitle keep the top space */}
      <div className={`pt-[max(env(safe-area-inset-top),1.25rem)] pb-4 ${collapsed ? "px-2" : "px-4"}`}>
        <div className={`flex min-w-0 ${collapsed ? "flex-col items-center gap-2" : "items-center gap-3"}`}>
          <Logo className="h-9 w-9 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand-copy"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={LABEL_TRANSITION}
                className="min-w-0 overflow-hidden"
              >
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none whitespace-nowrap">CalDo</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug whitespace-nowrap">Plan. Note. Remember.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className={`flex flex-col gap-1 ${collapsed ? "px-2 items-center" : "px-3"}`} aria-label="Pages">
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

      <div
        className={`mt-auto border-t border-slate-200 dark:border-slate-800 ${
          collapsed ? "px-2 py-3 flex flex-col items-center gap-1" : "px-3 py-3 flex flex-col gap-1"
        }`}
      >
        <button
          type="button"
          onClick={() => onToggleCollapse && onToggleCollapse()}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tip-pos="right"
          className={`rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors overflow-hidden ${
            collapsed
              ? "inline-flex items-center justify-center h-10 w-10"
              : "inline-flex items-center gap-3 w-full px-3 py-2.5 text-left"
          }`}
        >
          <motion.span
            key={collapsed ? "expand" : "collapse"}
            initial={{ opacity: 0, rotate: collapsed ? -90 : 90, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex shrink-0"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </motion.span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="collapse-label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={LABEL_TRANSITION}
                className="leading-none whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
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
