import React from "react";

// Matches the Tasks day header: muted label, semibold title, actions on the right.
export default function PageSectionHeader({ eyebrow, title, actions, children }) {
  return (
    <div className="mb-3 sm:mb-4 shrink-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{eyebrow}</div>
          ) : null}
          <div className="text-lg sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
