import React from "react";
import { Database, Palette } from "lucide-react";
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
  return (
    <div className="max-w-3xl w-full pb-6">
      <div className="sticky top-0 z-20 -mx-1 px-1 py-3 mb-3 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose how CalDo looks and manage your data.
        </p>
      </div>
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const Panel = section.Component;
          const panelProps = section.id === "data" ? { onExportAllData } : {};
          return (
            <section
              key={section.id}
              id={`settings-${section.id}`}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{section.description}</p>
                </div>
              </div>
              <Panel {...panelProps} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
