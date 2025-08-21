import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, HelpCircle, Search, RefreshCcw, Calendar, List, Plus, FileText, Clock, CheckCircle, AlertCircle, Info, Code, Copy } from "lucide-react";

export default function HelpPage({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const handleClose = useCallback(() => {
    console.log('HelpPage: Close button clicked');
    console.log('HelpPage: onClose function:', onClose);
    console.log('HelpPage: open state:', open);
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.error('HelpPage: onClose is not a function:', onClose);
    }
  }, [onClose, open]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && open) {
        console.log('HelpPage: Escape key pressed');
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    };

    if (open) {
      console.log('HelpPage: Adding keyboard listener');
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when help is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      console.log('HelpPage: Removing keyboard listener');
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, handleClose]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HelpCircle },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: List },
    { id: 'snippets', label: 'Snippets', icon: Code },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'features', label: 'Features', icon: Info }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <HelpCircle size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome to CalDo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          Your personal calendar and task management app. Here's everything you need to know to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 mb-3">
            <Calendar size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Calendar View</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Visual calendar with color-coded indicators for tasks and notes
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-3">
            <List size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Task Management</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Create, edit, and organize tasks with recurring options
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 mb-3">
            <FileText size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Daily Notes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Add personal notes and thoughts to any day
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 mb-3">
            <Code size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Snippets</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Store and manage reusable text snippets for any purpose
          </p>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Calendar Indicators</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          The calendar uses color-coded dots to show the status of each day
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Status Indicators</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-blue-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Blue dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Notes present for that day</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-red-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Red dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Incomplete tasks</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-amber-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Amber dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Mixed completion</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="inline-block w-4 h-4 rounded-full bg-green-500" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Green dot</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">All tasks complete</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Interactive Features</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Double-click a day</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Quickly add a task or note to any calendar day
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Drag & Drop</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Reschedule tasks by dragging them to different days
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Navigation</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Use arrow keys or click navigation to move between months
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Management</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Create, organize, and track your tasks with powerful features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Creating Tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Plus size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Press T key</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Quick task creation</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Calendar size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Double-click day</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Add task to specific date</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Task Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Completion</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Mark tasks as done</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <RefreshCcw size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Recurring</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Set repeating patterns</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recurring Tasks</h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>Frequency:</strong> Daily, Weekly, or Monthly</p>
          <p><strong>Interval:</strong> Every N days/weeks/months</p>
          <p><strong>Weekly:</strong> Choose specific days of the week</p>
          <p><strong>Monthly:</strong> Select day of the month</p>
          <p><strong>Ends:</strong> Never, on date, or after occurrences</p>
        </div>
      </div>
    </div>
  );

  const renderSnippets = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Snippets</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Store, organize, and quickly access reusable text snippets for any purpose
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Creating Snippets</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Plus size={16} className="text-indigo-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">New Snippet</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Click the + button to create</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Code size={16} className="text-purple-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Content Types</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Notes, reminders, quotes, recipes, or any text</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Snippet Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Search size={16} className="text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Search</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Find snippets quickly</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Copy size={16} className="text-green-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Copy</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">One-click copy to clipboard</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Snippet Management</h3>
        <div className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
          <p><strong>Organization:</strong> Pin important snippets for quick access</p>
          <p><strong>Search:</strong> Find snippets by title or content</p>
          <p><strong>Global Access:</strong> Use snippets from anywhere in the app</p>
          <p><strong>Versatile:</strong> Store any type of text - notes, quotes, recipes, etc.</p>
        </div>
      </div>
    </div>
  );

  const renderShortcuts = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Keyboard Shortcuts</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Speed up your workflow with these keyboard shortcuts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Add new task</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">T</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Open notes</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">N</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Open missed tasks</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">O</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-700">Open snippets</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">
            {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘⇧S' : 'Ctrl+Shift+S'}
          </kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Toggle density menu</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">Y</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Switch to Month view</span>
          <div className="space-x-1">
            <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">M</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Switch to Week view</span>
          <div className="space-x-1">
            <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">W</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Switch to Day view</span>
          <div className="space-x-1">
            <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">D</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Switch to Year view</span>
          <div className="space-x-1">
            <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">4</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Search tasks & notes</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">
            {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Go to previous month</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">←</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Go to next month</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">→</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Jump to today</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">0</kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200">Close dialog/drawer</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">Esc</kbd>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Advanced Features</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Discover powerful features to enhance your productivity
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Search size={20} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Global Search</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Quickly find tasks, notes, and snippets across all your data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">⌘K</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">Ctrl+K</kbd> to open search</li>
              <li>Search by task title, notes, or snippet content</li>
              <li>Use arrow keys to navigate results, Enter to select</li>
              <li>Click any result to jump to that date and item</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={20} className="text-green-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Daily Notes</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Add personal notes and thoughts to any day:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">N</kbd> to open notes</li>
              <li>Write daily reflections, ideas, or reminders</li>
              <li>Notes are automatically saved and synced</li>
              <li>Access notes from any device</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Code size={20} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Snippets</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Store and manage reusable text snippets for any purpose:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">⌘⇧S</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">Ctrl+Shift+S</kbd> to open snippets</li>
              <li>Create, organize, and search snippets</li>
              <li>Pin important snippets for quick access</li>
              <li>One-click copy to clipboard</li>
              <li>Store notes, reminders, quotes, recipes, or any text content</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={20} className="text-purple-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Missed Tasks</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Never lose track of incomplete tasks:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">M</kbd> to view missed tasks</li>
              <li>Review incomplete tasks from earlier days</li>
              <li>Reschedule or complete overdue items</li>
              <li>Maintain accountability and progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'calendar': return renderCalendar();
      case 'tasks': return renderTasks();
      case 'snippets': return renderSnippets();
      case 'shortcuts': return renderShortcuts();
      case 'features': return renderFeatures();
      default: return renderOverview();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-white/95 dark:bg-slate-900/95 backdrop-blur"
          onClick={(e) => {
            // Close when clicking on the backdrop (but not on content)
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <HelpCircle size={18} />
              <span className="font-semibold">CalDo — Help & Guide</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close help"
              data-tip="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex h-full pt-16">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <nav className="p-4">
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


