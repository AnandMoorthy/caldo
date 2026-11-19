import React, { useState } from "react";
import { Database, Palette } from "lucide-react";
import AppearanceSection from "./AppearanceSection.jsx";
import DataSection from "./DataSection.jsx";
import { useScrollChrome } from "../../context/ScrollChromeContext.jsx";
import CollapsingChrome from "../CollapsingChrome.jsx";

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
  const { chromeHidden } = useScrollChrome();

  return (
    <div className="max-w-3xl w-full pb-6">
      <div className="sticky top-0 z-20 -mx-1 px-1 mb-4 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md">
        <CollapsingChrome hidden={chromeHidden}>
          <div className="pt-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose how CalDo looks and manage your data.
            </p>

            <div
              className="mt-4 inline-flex w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 p-1 gap-1"
              role="tablist"
              aria-label="Settings sections"
            >
              {SECTIONS.map((section) => {
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
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selected
                        ? "bg-white dark:bg-slate-100 text-slate-900 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <TabIcon size={15} aria-hidden="true" />
                    {section.title}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 border-b border-slate-200/70 dark:border-slate-800/70" aria-hidden="true" />
          </div>
        </CollapsingChrome>
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
