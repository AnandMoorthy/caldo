import React from "react";
import { CheckSquare, StickyNote, Sparkles, Target, PanelLeftClose, PanelLeftOpen, BookOpenText, Settings } from "lucide-react";
import Logo from "./Logo.jsx";

const PAGES = [
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "journal", label: "Journal", icon: BookOpenText },
  { key: "moments", label: "Moments", icon: Sparkles },
  { key: "habits", label: "Habits", icon: Target },
];

export default function Sidebar({ activeTab = "tasks", onChangeTab, collapsed = false, onToggleCollapse }) {
  return (
    <aside className={`hidden sm:flex flex-col shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-[width] duration-200 ease-out ${collapsed ? "w-[4.5rem]" : "w-56"}`}>
      <div className={`flex gap-2 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 ${collapsed ? "flex-col items-center px-2" : "items-start justify-between px-4"}`}>
        <div className={`flex min-w-0 ${collapsed ? "justify-center" : "items-center gap-2.5"}`}>
          <Logo className="h-8 w-8" />
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">CalDo</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">Plan. Note. Remember.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleCollapse && onToggleCollapse()}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tip-pos="right"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className={`flex flex-col gap-1 ${collapsed ? "px-2 items-center" : "px-3"}`} aria-label="Pages">
        {PAGES.map((page) => {
          const isActive = activeTab === page.key || (page.key === "notes" && activeTab === "snippets");
          const Icon = page.icon;
          return (
            <button
              key={page.key}
              type="button"
              onClick={() => onChangeTab && onChangeTab(page.key)}
              aria-current={isActive ? "page" : undefined}
              aria-label={page.label}
              data-tip={collapsed ? page.label : undefined}
              data-tip-pos="right"
              className={`flex items-center rounded-xl text-sm font-medium transition-colors ${
                collapsed ? "justify-center h-10 w-10" : "gap-3 px-3 py-2.5 text-left w-full"
              } ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 2} className="shrink-0" />
              {!collapsed && <span>{page.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className={`mt-auto border-t border-slate-200 dark:border-slate-800 ${collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}>
        <button
          type="button"
          onClick={() => onChangeTab && onChangeTab("settings")}
          aria-current={activeTab === "settings" ? "page" : undefined}
          aria-label="Settings"
          data-tip={collapsed ? "Settings" : undefined}
          data-tip-pos="right"
          className={`flex items-center rounded-xl text-sm font-medium transition-colors ${
            collapsed ? "justify-center h-10 w-10" : "gap-3 px-3 py-2.5 text-left w-full"
          } ${
            activeTab === "settings"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Settings size={18} strokeWidth={activeTab === "settings" ? 2.25 : 2} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
