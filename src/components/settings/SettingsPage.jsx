import React, { useState } from "react";
import { Database, Palette } from "lucide-react";
import PageSectionHeader from "../PageSectionHeader.jsx";
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

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
        <PageSectionHeader eyebrow={activeSection.title} title="Settings">
          <div
            className="mt-3 inline-flex w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
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
        </PageSectionHeader>

        <section
          role="tabpanel"
          id={`settings-panel-${activeSection.id}`}
          aria-labelledby={`settings-tab-${activeSection.id}`}
        >
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{activeSection.description}</p>
          <Panel {...panelProps} />
        </section>
      </div>
    </main>
  );
}
