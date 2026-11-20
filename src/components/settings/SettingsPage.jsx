import React, { useState } from "react";
import { Database, Palette, Settings } from "lucide-react";
import AppearanceSection from "./AppearanceSection.jsx";
import DataSection from "./DataSection.jsx";

// Add a section here when a new settings group is ready.
const SECTIONS = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Pick a theme. Each one includes a light and a dark mode.",
    icon: Palette,
    Component: AppearanceSection,
  },
  {
    id: "data",
    title: "Data",
    description: "Back up your CalDo content as a JSON file.",
    icon: Database,
    Component: DataSection,
  },
];

export default function SettingsPage({ onExportAllData }) {
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);
  const activeSection = SECTIONS.find((s) => s.id === activeSectionId) || SECTIONS[0];
  const Panel = activeSection.Component;
  const panelProps = activeSection.id === "data" ? { onExportAllData } : {};
  const Icon = activeSection.icon;

  return (
    <div className="max-w-3xl w-full pb-6">
      <div className="sticky top-0 z-20 -mx-1 px-1 pt-3 pb-3 mb-4 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="font-semibold flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
          <Settings size={18} className="shrink-0" />
          <span>Settings</span>
        </div>

        <div
          className="mt-2 inline-flex w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          role="tablist"
          aria-label="Settings sections"
        >
          {SECTIONS.map((section, index) => {
            const TabIcon = section.icon;
            const selected = section.id === activeSection.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                id={`settings-tab-${section.id}`}
                aria-selected={selected}
                aria-controls={`settings-panel-${section.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveSectionId(section.id)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  index > 0 ? "border-l border-slate-200 dark:border-slate-700" : ""
                } ${
                  selected
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <TabIcon size={14} aria-hidden="true" />
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      <section
        role="tabpanel"
        id={`settings-panel-${activeSection.id}`}
        aria-labelledby={`settings-tab-${activeSection.id}`}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{activeSection.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{activeSection.description}</p>
          </div>
        </div>
        <Panel {...panelProps} />
      </section>
    </div>
  );
}
