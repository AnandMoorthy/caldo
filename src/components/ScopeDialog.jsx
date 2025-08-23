import React from "react";

export default function ScopeDialog({ open, onClose, onOnlyThis, onEntireSeries, actionType = 'delete' }) {
  if (!open) return null;
  
  const isEdit = actionType === 'edit';
  const title = isEdit ? 'Edit which occurrences?' : 'Apply to which occurrences?';
  const description = isEdit 
    ? 'Choose how you want to edit this recurring task.'
    : 'Choose how you want to apply this action for the recurring task.';
  
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
        <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">{description}</div>
        <div className="grid gap-2">
          <button onClick={onOnlyThis} className="w-full text-left px-3 py-2 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            {isEdit ? 'Only this occurrence' : 'Only this occurrence'}
          </button>
          <button onClick={onEntireSeries} className={`w-full text-left px-3 py-2 rounded border ${
            isEdit 
              ? 'border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
              : 'border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}>
            {isEdit ? 'Entire series' : 'Entire series'}
          </button>
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-3 py-2 rounded bg-slate-100 dark:bg-slate-800">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}


