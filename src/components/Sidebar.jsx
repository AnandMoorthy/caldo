import React from "react";
import { CheckSquare, StickyNote, Sparkles, Target, BookOpenText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Logo from "./Logo.jsx";

const PAGES = [
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "journal", label: "Journal", icon: BookOpenText },
  { key: "moments", label: "Moments", icon: Sparkles },
  { key: "habits", label: "Habits", icon: Target },
];

function NavButton({ active, collapsed, label, icon: Icon, onClick, tip }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-tip={collapsed ? tip || label : undefined}
      data-tip-pos="right"
      className={`group flex items-center rounded-xl text-sm font-medium transition-colors duration-150 ${
        collapsed ? "justify-center h-10 w-10" : "w-full gap-3 px-3 py-2.5 text-left"
      } ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 2} className="shrink-0" />
      {!collapsed && <span className="truncate leading-none">{label}</span>}
    </button>
  );
}

export default function Sidebar({ activeTab = "tasks", onChangeTab, collapsed = false, onToggleCollapse }) {
  return (
    <aside
      className={`hidden sm:flex flex-col shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-[width] duration-200 ease-out ${
        collapsed ? "w-[4.5rem]" : "w-56"
      }`}
    >
      {/* Brand block — logo + title + subtitle keep the top space */}
      <div className={`pt-[max(env(safe-area-inset-top),1.25rem)] pb-4 ${collapsed ? "px-2" : "px-4"}`}>
        <div className={`flex min-w-0 ${collapsed ? "flex-col items-center gap-2" : "items-center gap-3"}`}>
          <Logo className="h-9 w-9 shrink-0" />
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">CalDo</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">Plan. Note. Remember.</p>
          </div>
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
          className={`rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
            collapsed
              ? "inline-flex items-center justify-center h-10 w-10"
              : "inline-flex items-center gap-3 w-full px-3 py-2.5 text-left"
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} className="shrink-0" />}
          {!collapsed && <span className="leading-none">Collapse</span>}
        </button>
        <NavButton
          active={activeTab === "settings"}
          collapsed={collapsed}
          label="Settings"
          icon={Settings}
          onClick={() => onChangeTab && onChangeTab("settings")}
        />
      </div>
    </aside>
  );
}
