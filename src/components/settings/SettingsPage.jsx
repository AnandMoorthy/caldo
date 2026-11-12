import React from "react";
import { Palette } from "lucide-react";
import AppearanceSection from "./AppearanceSection.jsx";

// Add a section here when a new settings group is ready.
const SECTIONS = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Pick a theme. Each one includes a light and a dark mode.",
    icon: Palette,
    Component: AppearanceSection,
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="sticky top-0 z-20 -mx-1 px-1 py-3 mb-2 bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-50/80 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose how CalDo looks. More preferences can be added here later.
        </p>
      </div>
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const Panel = section.Component;
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
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{section.description}</p>
                </div>
              </div>
              <Panel />
            </section>
          );
        })}
      </div>
    </div>
  );
}
