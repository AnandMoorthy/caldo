import React from "react";
import Header from "./Header.jsx";

export default function FocusedContentView({
  user,
  headerTab = 'notes',
  headerTitle = '',
  onClose,
  // Title controls (optional)
  title = '',
  onChangeTitle = null,
  // Editor renderer: render function returning the editor element
  renderEditor,
  // Save controls
  saving = false,
  canSave = true,
  onSave,
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-10 safe-pt safe-pb font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto w-full">
        <Header
          user={user}
          onSignInWithGoogle={() => {}}
          onSignOut={() => {}}
          onExportJSON={() => {}}
          onImportJSON={() => {}}
          onOpenHelp={() => {}}
          onOpenSearch={() => {}}
          onOpenPomodoro={() => {}}
          currentStreak={0}
          deleteAllTasksEnabled={false}
          onDeleteAllTasks={() => {}}
          currentView={'month'}
          onChangeView={() => {}}
          activeTab={headerTab}
          onChangeTab={(tab) => {
            try { localStorage.setItem('caldo_v2_active_tab', tab); } catch {}
            try { if (tab === 'notes') window.location.hash = ''; } catch {}
          }}
          pomodoroEnabled={false}
          showTabs={false}
          showSearch={false}
        />
      </div>
      <div className="flex-1 w-full mt-6">
        <div className="max-w-3xl mx-auto h-full flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">{headerTitle}</div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded bg-slate-100 dark:bg-slate-800"
          >
            Close
          </button>
        </div>
        {typeof onChangeTitle === 'function' ? (
          <div className="mb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
        ) : null}
          <div className="flex-1 min-h-0 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            {renderEditor ? renderEditor() : null}
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !canSave}
              className={`px-4 py-2 rounded text-white ${saving ? 'bg-indigo-500' : canSave ? 'bg-indigo-600' : 'bg-indigo-400'}`}
            >
              {saving ? 'Saving…' : (canSave ? 'Save' : 'Saved')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


