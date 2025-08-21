import React from "react";

export default function ViewSwitcher({ value = 'month', onChange }) {
  const options = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1" role="tablist" aria-label="Calendar view">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange && onChange(opt.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              active
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow border border-slate-200 dark:border-slate-700'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}


