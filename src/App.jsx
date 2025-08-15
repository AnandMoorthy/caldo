import React, { useEffect, useMemo, useState, useRef } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Plus, Check, StickyNote } from "lucide-react";
import { auth, db, googleProvider, firebase } from "./firebase";
import Header from "./components/Header.jsx";
import Calendar from "./components/Calendar.jsx";
import TaskList from "./components/TaskList.jsx";
import AddTaskDrawer from "./components/AddTaskDrawer.jsx";
import EditTaskModal from "./components/modals/EditTaskModal.jsx";
import CelebrationCanvas from "./components/CelebrationCanvas.jsx";
import MissedTasksDrawer from "./components/MissedTasksDrawer.jsx";
import DayNotesDrawer from "./components/DayNotesDrawer.jsx";
import HelpPage from "./components/HelpPage.jsx";
import SearchModal from "./components/SearchModal.jsx";
import { loadTasks, saveTasks, loadStreak, saveStreak } from "./utils/storage";
import { generateId } from "./utils/uid";
import { keyFor, monthKeyFromDate, monthKeyFromDateKey, getMonthMapFor } from "./utils/date";
import { buildSearchIndex, searchTasks } from "./utils/search.js";
import { DRAG_MIME } from "./constants";
import { createTaskRepository } from "./services/repositories/taskRepository";
import { createDayNoteRepository } from "./services/repositories/noteRepository";


// Single-file Caldo app
// Tailwind styling expected. NPM deps: date-fns, framer-motion, lucide-react

// Storage helpers moved to utils/storage.js

export default function App() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksMap, setTasksMap] = useState(() => loadTasks());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", notes: "", priority: "medium", subtasks: [] });
  const [showEdit, setShowEdit] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", notes: "", priority: "medium" });
  const [user, setUser] = useState(null);
  const hasLoadedCloud = useRef(false);
  const loadedMonthsRef = useRef(new Set());
  
  // Repositories
  const taskRepoRef = useRef(null);
  const noteRepoRef = useRef(null);
  // profile menu moved into Header component
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(monthStart);
  const [dragOverDayKey, setDragOverDayKey] = useState(null);
  const [showMissed, setShowMissed] = useState(false);
  const [draftDayNote, setDraftDayNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesJustSaved, setNotesJustSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);

  // Streak state: current, longest, lastEarnedDateKey
  const [streak, setStreak] = useState(() => loadStreak());
  // no-op ref removed; we use interval-based checker

  // Celebration state and bookkeeping
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDateKey, setCelebrationDateKey] = useState(null);
  const celebrationTimerRef = useRef(null);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const isDev = Boolean(import.meta?.env?.DEV);
  const debugCloud = (...args) => {
    try {
      if (isDev) console.debug('[cloud]', ...args);
    } catch {}
  };

  function triggerCelebration(dateKey) {
    setCelebrationDateKey(dateKey);
    setShowCelebration(true);
    setConfettiSeed((s) => s + 1);
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => {
      setShowCelebration(false);
    }, 2800);
  }

  useEffect(() => {
    saveTasks(tasksMap);
  }, [tasksMap]);

  // Build search index when tasks change
  useEffect(() => {
    const newIndex = buildSearchIndex(tasksMap);
    setSearchIndex(newIndex);
  }, [tasksMap]);

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchTasks(searchQuery, searchIndex);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchIndex]);

  // Keep draft note in sync when tasksMap changes for the selected day (e.g., remote refresh)
  useEffect(() => {
    try {
      setDraftDayNote(getDayNoteByKey(keyFor(selectedDate)));
    } catch {}
  }, [tasksMap, selectedDate]);

  // Global keyboard shortcuts: T add task, N open notes, ? open help, CMD+K/Ctrl+K search, Esc close
  useEffect(() => {
    function onKeyDown(e) {
      // Allow Esc even inside inputs; ignore other keys while typing or with modifiers
      const tag = (e.target && e.target.tagName) || '';
      const key = (e.key || '').toLowerCase();
      if (key === 'escape') {
        if (showAdd) setShowAdd(false);
        if (showEdit) setShowEdit(false);
        if (showNotes) setShowNotes(false);
        if (showMissed) setShowMissed(false);
        if (showHelp) setShowHelp(false);
        if (showSearch) setShowSearch(false);
        return;
      }
      if (/(INPUT|TEXTAREA|SELECT)/.test(tag)) return;
      
      // Handle CMD+K/Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setSearchQuery("");
        return;
      }
      
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (key === 't') {
        e.preventDefault();
        openAddModal(selectedDate);
      } else if (key === 'n') {
        e.preventDefault();
        setShowNotes(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDate, showAdd, showEdit, showNotes, showMissed, showHelp, showSearch]);

  useEffect(() => {
    saveStreak(streak);
  }, [streak]);

  // celebration canvas moved to component

  // date helpers moved to utils/date.js

  async function saveMonthToCloud(userId, monthKey, monthMap) {
    const docRef = db.collection('users').doc(userId).collection('todos').doc(monthKey);
    debugCloud('saveMonth', { userId, monthKey, days: Object.keys(monthMap || {}).length });
    // Merge the provided days into the 'todos' map without overwriting other days
    await docRef.set({ updatedAt: new Date(), todos: monthMap || {} }, { merge: true });
  }

  async function saveDayToCloud(userId, dateKey, listForDay) {
    const monthKey = monthKeyFromDateKey(dateKey);
    const docRef = db.collection('users').doc(userId).collection('todos').doc(monthKey);
    debugCloud('saveDay', { userId, dateKey, monthKey, count: (listForDay || []).length });
    // Merge only this day under the 'todos' map
    await docRef.set({ updatedAt: new Date(), todos: { [dateKey]: listForDay || [] } }, { merge: true });
  }

  async function deleteDayFromCloud(userId, dateKey) {
    const monthKey = monthKeyFromDateKey(dateKey);
    const docRef = db.collection('users').doc(userId).collection('todos').doc(monthKey);
    try {
      debugCloud('deleteDay', { userId, dateKey, monthKey });
      // Use set with merge and FieldValue.delete to reliably remove nested day key
      await docRef.set(
        { updatedAt: new Date(), todos: { [dateKey]: firebase.firestore.FieldValue.delete() } },
        { merge: true }
      );
    } catch (err) {
      // If doc doesn't exist or update fails, ignore silently
      // A subsequent save will create the doc as needed
      console.warn('Cloud deleteDay failed (non-fatal)', err);
    }
  }

  async function loadMonthFromCloud(userId, monthKey) {
    const docRef = db.collection('users').doc(userId).collection('todos').doc(monthKey);
    const snap = await docRef.get();
    if (!snap.exists) return {};
    const data = snap.data() || {};
    return data.todos || data.tasksMap || data.dates || {};
  }

  async function ensureMonthLoaded(userId, monthKey) {
    if (loadedMonthsRef.current.has(monthKey)) return;
    loadedMonthsRef.current.add(monthKey);
    try {
      // New schema: read tasks and notes for month via repositories
      if (!taskRepoRef.current || !noteRepoRef.current) return;
      const [y, m] = monthKey.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      const tasks = await taskRepoRef.current.fetchTasksInRange(start, end);
      const notes = await noteRepoRef.current.fetchMonthNotes(monthKey);
      const byDate = {};
      tasks.forEach(t => {
        const dk = t.dateKey;
        if (!byDate[dk]) byDate[dk] = [];
        // Ensure UI expects 'due' to be present
        byDate[dk].push({ ...t, due: dk });
      });
      notes.forEach(n => {
        const dk = n.dateKey;
        const existing = byDate[dk] || [];
        const list = existing.slice();
        if (n.content) list.push({ id: 'day_note', due: dk, dayNote: n.content, createdAt: n.updatedAt || new Date().toISOString() });
        byDate[dk] = list;
      });
      setTasksMap((prev) => mergeTasksMaps(prev, byDate));
    } catch (e) {
      console.error('Failed to load month from cloud', e);
    }
  }

  function mergeTaskListsById(localList, cloudList) {
    const byId = new Map();
    for (const t of localList || []) byId.set(t.id, t);
    for (const t of cloudList || []) {
      if (!byId.has(t.id)) byId.set(t.id, t);
      else {
        const existing = byId.get(t.id);
        // Prefer cloud (t) over local (existing) on conflicts
        byId.set(t.id, { ...existing, ...t });
      }
    }
    return Array.from(byId.values());
  }

  function sortTasksByCreatedDesc(list) {
    return [...(list || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function refreshDayFromCloud(userId, dateKey) {
    try {
      if (!taskRepoRef.current || !noteRepoRef.current) return;
      const tasks = await taskRepoRef.current.fetchTasksForDate(dateKey);
      const tasksWithDue = (tasks || []).map(t => ({ ...t, due: dateKey }));
      const note = await noteRepoRef.current.getDayNote(dateKey);
      const taskList = sortTasksByCreatedDesc(tasksWithDue);
      const fullList = note?.content ? [...taskList, { id: 'day_note', due: dateKey, dayNote: note.content, createdAt: note.updatedAt || new Date().toISOString() }] : taskList;
      setTasksMap((prev) => {
        const prevList = prev[dateKey] || [];
        const prevJson = JSON.stringify(prevList);
        const nextJson = JSON.stringify(fullList);
        if (prevJson === nextJson) return prev;
        return { ...prev, [dateKey]: fullList };
      });
    } catch (e) {
      console.error('Failed to refresh day from cloud', e);
    }
  }

  async function saveStreakToCloud(userId, s) {
    const docRef = db.collection('users').doc(userId).collection('meta').doc('streakInfo');
    await docRef.set({
      current: Number(s?.current) || 0,
      longest: Number(s?.longest) || 0,
      lastEarnedDateKey: s?.lastEarnedDateKey || null,
      updatedAt: new Date(),
    }, { merge: true });
  }

  function todayKey() {
    return keyFor(new Date());
  }

  function yesterdayKey() {
    return keyFor(addDays(new Date(), -1));
  }

  function ensureStreakUpToDate(s) {
    try {
      const t = todayKey();
      const y = yesterdayKey();
      if (s?.lastEarnedDateKey === t || s?.lastEarnedDateKey === y) return s;
      return { current: 0, longest: Number(s?.longest) || 0, lastEarnedDateKey: null };
    } catch {
      return { current: 0, longest: Number(s?.longest) || 0, lastEarnedDateKey: null };
    }
  }

  // Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Initialize repositories for the new user
        taskRepoRef.current = createTaskRepository(u.uid);
        noteRepoRef.current = createDayNoteRepository(u.uid);
        
        // Load current month from Firestore and merge with local
        try {
          const currentMonthKey = monthKeyFromDate(new Date());
          let monthMap = {};
          if (taskRepoRef.current && noteRepoRef.current) {
            const [y, m] = currentMonthKey.split('-');
            const start = new Date(Number(y), Number(m) - 1, 1);
            const end = new Date(Number(y), Number(m), 1);
            const tasks = await taskRepoRef.current.fetchTasksInRange(start, end);
            const notes = await noteRepoRef.current.fetchMonthNotes(currentMonthKey);
            const byDate = {};
            tasks.forEach(t => {
              const dk = t.dateKey;
              if (!byDate[dk]) byDate[dk] = [];
              byDate[dk].push({ ...t, due: dk });
            });
            notes.forEach(n => {
              const dk = n.dateKey;
              const existing = byDate[dk] || [];
              const list = existing.slice();
              if (n.content) list.push({ id: 'day_note', due: dk, dayNote: n.content, createdAt: n.updatedAt || new Date().toISOString() });
              byDate[dk] = list;
            });
            monthMap = byDate;
          }
          
          hasLoadedCloud.current = true;
          loadedMonthsRef.current.add(currentMonthKey);
          setTasksMap((prev) => {
            const merged = mergeTasksMaps(prev, monthMap);
            // TODO: Convert existing local data to new schema format
            // For now, we'll keep the old sync logic but mark it for removal
            try {
              const months = new Set(Object.keys(merged).map((k) => monthKeyFromDateKey(k)));
              months.forEach((m) => {
                const mMap = getMonthMapFor(merged, m);
                // TODO: Convert to new schema and save using firebaseService
                // saveMonthToCloud(u.uid, m, mMap).catch((err) => console.error('Cloud month sync failed', err));
              });
            } catch (err) {
              console.error('Bulk month sync failed', err);
            }
            return merged;
          });

          // Load streak from cloud '/users/{uid}/meta/streakInfo' doc and merge
          try {
            const streakDoc = await db.collection('users').doc(u.uid).collection('meta').doc('streakInfo').get();
            const si = streakDoc.exists ? (streakDoc.data() || {}) : {};
            const cloudStreak = {
              current: Number(si.current) || 0,
              longest: Number(si.longest) || 0,
              lastEarnedDateKey: si.lastEarnedDateKey || null,
            };
            const localStreak = loadStreak();
            const mergedStreak = ensureStreakUpToDate({
              current: cloudStreak.current ?? localStreak.current ?? 0,
              longest: Math.max(Number(localStreak.longest) || 0, Number(cloudStreak.longest) || 0),
              lastEarnedDateKey: cloudStreak.lastEarnedDateKey || localStreak.lastEarnedDateKey || null,
            });
            setStreak(mergedStreak);
          } catch (err) {
            console.error('Failed to load streak from cloud', err);
            setStreak((s) => ensureStreakUpToDate(s));
          }
        } catch (e) {
          console.error('Failed to load current month from cloud', e);
        }
      } else {
        hasLoadedCloud.current = false;
        loadedMonthsRef.current = new Set();
        taskRepoRef.current = null;
        noteRepoRef.current = null;
        setStreak((s) => ensureStreakUpToDate(s));
      }
    });
    return () => unsub();
  }, []);

  // Lazy-load month data when user navigates months
  useEffect(() => {
    if (!user) return;
    const mk = monthKeyFromDate(monthStart);
    if (loadedMonthsRef.current.has(mk)) return;
    ensureMonthLoaded(user.uid, mk);
  }, [user, monthStart]);

  // No effect-based triggers; we trigger celebration directly from user actions when a day becomes fully complete.

  function mergeTasksMaps(localMap, cloudMap) {
    const result = { ...localMap };
    for (const dateKey of Object.keys(cloudMap || {})) {
      const localList = result[dateKey] || [];
      const cloudList = cloudMap[dateKey] || [];
      const byId = new Map();
      for (const t of localList) byId.set(t.id, t);
      for (const t of cloudList) {
        if (!byId.has(t.id)) byId.set(t.id, t);
        else {
          const existing = byId.get(t.id);
          // Prefer cloud task over local task on conflicts
          byId.set(t.id, { ...existing, ...t });
        }
      }
      const mergedList = Array.from(byId.values());
      if (mergedList.length) result[dateKey] = mergedList; else delete result[dateKey];
    }
    return result;
  }

  async function signInWithGoogle() {
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (e) {
      // Some environments with COOP/COEP block popup cleanup; fall back to redirect
      console.warn('Popup sign-in failed, falling back to redirect', e);
      try {
        await auth.signInWithRedirect(googleProvider);
      } catch (err) {
        alert('Sign-in failed');
        console.error(err);
      }
    }
  }

  async function signOut() {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
  }

  // header avatar moved to Header

  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [cursor]);

  function nextMonth() {
    setCursor(addMonths(cursor, 1));
  }
  function prevMonth() {
    setCursor(subMonths(cursor, 1));
  }

  function isNoteItem(item) {
    return item && item.id === 'day_note';
  }

  function splitDayList(list) {
    const noteItem = (list || []).find((t) => isNoteItem(t)) || null;
    const taskList = (list || []).filter((t) => !isNoteItem(t));
    return { taskList, noteItem };
  }

  function mergeDayList(taskList, noteItem) {
    return noteItem ? [...(taskList || []), noteItem] : [...(taskList || [])];
  }

  function tasksFor(date) {
    const list = tasksMap[keyFor(date)] || [];
    const { taskList } = splitDayList(list);
    return sortTasksByCreatedDesc(taskList);
  }

  function getDayNoteByKey(dateKey) {
    const list = tasksMap[dateKey] || [];
    const noteItem = list.find((t) => isNoteItem(t));
    return noteItem?.dayNote || "";
  }

  async function saveDayNoteForKey(dateKey, noteText) {
    const text = (noteText || "").trim();
    // Build the new full list from current state
    const prevList = tasksMap[dateKey] || [];
    const { taskList, noteItem } = splitDayList(prevList);
    const newNoteItem = text
      ? {
          id: 'day_note',
          due: dateKey,
          dayNote: text,
          createdAt: noteItem?.createdAt || new Date().toISOString(),
        }
      : null;
    const sortedTasks = sortTasksByCreatedDesc(taskList);
    const fullList = mergeDayList(sortedTasks, newNoteItem);
    // Update local state immediately
    setTasksMap((prev) => {
      const updated = { ...prev };
      if (fullList.length) updated[dateKey] = fullList; else delete updated[dateKey];
      return updated;
    });
    // Persist to cloud using flat schema
    try {
      if (user && noteRepoRef.current) {
        if (text) {
          await noteRepoRef.current.saveDayNote(dateKey, text);
        } else {
          await noteRepoRef.current.deleteDayNote(dateKey);
        }
      }
    } catch (err) {
      console.error('Cloud saveDayNote failed', err);
    }
  }

  function hasNoteForDay(date) {
    try {
      const dk = keyFor(date);
      const list = tasksMap[dk] || [];
      return list.some((t) => isNoteItem(t) && (t.dayNote || "").trim().length > 0);
    } catch { return false; }
  }

  // Navigate to search result item
  function navigateToSearchResult(result) {
    try {
      const dateKey = result.dateKey;
      const date = parseISO(dateKey);
      
      // Navigate to the date in calendar
      setSelectedDate(date);
      setCursor(date);
      
      // Close search modal
      setShowSearch(false);
      setSearchQuery("");
      
      // If it's a note, open the notes drawer
      if (result.type === 'note') {
        setShowNotes(true);
      }
      
      // TODO: In future phases, we can add highlighting and scrolling to specific tasks
    } catch (error) {
      console.error('Failed to navigate to search result:', error);
    }
  }

  // Build a flattened list of this month's incomplete tasks from past days only
  const missedTasksThisMonth = useMemo(() => {
    const today = new Date();
    const currentMonthKey = monthKeyFromDate(monthStart);
    const items = [];
    for (const [dateKey, list] of Object.entries(tasksMap || {})) {
      if (!dateKey.startsWith(currentMonthKey + "-")) continue;
      const dateObj = parseISO(dateKey);
      // only past dates strictly before today
      if (dateObj >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) continue;
      for (const t of list) {
        if (isNoteItem(t)) continue;
        if (!t.done) items.push(t);
      }
    }
    // newest first like the rest of the app
    return sortTasksByCreatedDesc(items);
  }, [tasksMap, monthStart]);

  function openAddModal(date) {
    setSelectedDate(date);
    setForm({ title: "", notes: "", priority: "medium", subtasks: [] });
    setShowAdd(true);
  }

  function addTask(e, options = {}) {
    e.preventDefault();
    const key = keyFor(selectedDate);
    const subtasks = (Array.isArray(form.subtasks) ? form.subtasks : [])
      .map((st) => ({ id: st.id || generateId(), title: (st.title || '').trim(), done: !!st.done, createdAt: new Date().toISOString() }))
      .filter((st) => !!st.title);
    const newTask = {
      id: generateId(),
      title: form.title || "Untitled",
      notes: form.notes || "",
      done: false,
      priority: form.priority || "medium",
      due: key,
      createdAt: new Date().toISOString(),
      ...(subtasks.length ? { subtasks } : {}),
    };
    setTasksMap((prev) => {
      const prevList = prev[key] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const updatedTasks = sortTasksByCreatedDesc([newTask, ...taskList]);
      // Adding a new incomplete task should not trigger; guard by checking prev->new transition
      const fullList = mergeDayList(updatedTasks, noteItem);
      const updated = { ...prev, [key]: fullList };
      if (user && taskRepoRef.current) {
        taskRepoRef.current.saveTask(key, newTask).catch((err) => console.error('Cloud addTask failed', err));
      }
      return updated;
    });
    if (options?.addAnother) {
      setForm({ title: "", notes: "", priority: "medium", subtasks: [] });
      setShowAdd(true);
    } else {
      setShowAdd(false);
    }
  }

  function openEditModal(task) {
    setEditTask(task);
    setEditForm({ title: task.title, notes: task.notes, priority: task.priority || 'medium' });
    setShowEdit(true);
  }

  function saveEdit(e) {
    e.preventDefault();
    if (!editTask) return;
    setTasksMap((prev) => {
      const prevList = prev[editTask.due] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const list = taskList.map((t) =>
        t.id === editTask.id
          ? { ...t, title: editForm.title || 'Untitled', notes: editForm.notes || '', priority: editForm.priority || 'medium' }
          : t
      );
      const sortedTasks = sortTasksByCreatedDesc(list);
      const fullList = mergeDayList(sortedTasks, noteItem);
      const updated = { ...prev, [editTask.due]: fullList };
      if (user && taskRepoRef.current) {
        const updatedTask = list.find(t => t.id === editTask.id);
        if (updatedTask) taskRepoRef.current.saveTask(editTask.due, updatedTask).catch((err) => console.error('Cloud saveEdit failed', err));
      }
      return updated;
    });
    setShowEdit(false);
    setEditTask(null);
  }

  function toggleDone(task) {
    setTasksMap((prev) => {
      const prevList = prev[task.due] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const list = taskList.map((t) => {
        if (t.id !== task.id) return t;
        const nextDone = !t.done;
        // If marking parent task done, also mark all subtasks done for coherence
        const nextSubtasks = Array.isArray(t.subtasks)
          ? t.subtasks.map((st) => ({ ...st, done: nextDone ? true : st.done }))
          : t.subtasks;
        return { ...t, done: nextDone, subtasks: nextSubtasks };
      });
      const prevAllDone = taskList.length > 0 && taskList.every((t) => t.done);
      const newAllDone = list.length > 0 && list.every((t) => t.done);
      if (!prevAllDone && newAllDone) {
        triggerCelebration(task.due);
        // Streak can only be earned for today
        if (task.due === todayKey()) {
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: todayKey() };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (prevAllDone && !newAllDone) {
        // If undoing completion for today after earning, revert streak
        if (task.due === todayKey()) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== todayKey()) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      const sortedTasks = sortTasksByCreatedDesc(list);
      const fullList = mergeDayList(sortedTasks, noteItem);
      const updated = { ...prev, [task.due]: fullList };
      if (user && taskRepoRef.current) {
        taskRepoRef.current.setTaskDone(task.id, !task.done).catch((err) => console.error('Cloud toggleDone failed', err));
      }
      return updated;
    });
  }

  function deleteTask(task) {
    setTasksMap((prev) => {
      const prevList = prev[task.due] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const list = taskList.filter((t) => t.id !== task.id);
      const prevAllDone = taskList.length > 0 && taskList.every((t) => t.done);
      const newAllDone = list.length > 0 && list.every((t) => t.done);
      if (!prevAllDone && newAllDone) {
        // Deleting the only incomplete task could complete the day, so trigger
        triggerCelebration(task.due);
        if (task.due === todayKey()) {
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: todayKey() };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (prevAllDone && !newAllDone) {
        if (task.due === todayKey()) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== todayKey()) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      const copy = { ...prev };
      const sortedTasks = sortTasksByCreatedDesc(list);
      const fullList = mergeDayList(sortedTasks, noteItem);
      if (fullList.length) copy[task.due] = fullList;
      else delete copy[task.due];
      if (user && taskRepoRef.current) {
        (async () => {
          try {
            await taskRepoRef.current.deleteTask(task.id);
          } catch (err) {
            console.error('Cloud deleteTask failed', err);
          }
        })();
      }
      return copy;
    });
  }

  // Subtasks: add, toggle, delete
  function addSubtask(parentTask, title) {
    const trimmed = (title || '').trim();
    if (!trimmed) return;
    const dueKey = parentTask.due;
    setTasksMap((prev) => {
      const prevList = prev[dueKey] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const list = taskList.map((t) => {
        if (t.id !== parentTask.id) return t;
        const currentSubtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
        const newSubtasks = [
          ...currentSubtasks,
          { id: generateId(), title: trimmed, done: false, createdAt: new Date().toISOString() },
        ];
        // Parent is considered done only if all subtasks are done
        const parentDone = newSubtasks.length > 0 ? newSubtasks.every((st) => st.done) : t.done;
        return { ...t, subtasks: newSubtasks, done: parentDone && t.done };
      });

      const prevAllDone = taskList.length > 0 && taskList.every((t) => t.done);
      const newAllDone = list.length > 0 && list.every((t) => t.done);
      if (!prevAllDone && newAllDone) {
        triggerCelebration(dueKey);
        if (dueKey === todayKey()) {
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: todayKey() };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (prevAllDone && !newAllDone) {
        if (dueKey === todayKey()) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== todayKey()) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }

      const sortedTasks = sortTasksByCreatedDesc(list);
      const fullList = mergeDayList(sortedTasks, noteItem);
      const updated = { ...prev, [dueKey]: fullList };
      if (user && taskRepoRef.current) {
        const updatedTask = list.find(t => t.id === parentTask.id);
        if (updatedTask) taskRepoRef.current.saveTask(dueKey, updatedTask).catch((err) => console.error('Cloud addSubtask failed', err));
      }
      return updated;
    });
  }

  function toggleSubtask(parentTask, subtaskId) {
    if (!parentTask || !subtaskId) return;
    const dueKey = parentTask.due;
    setTasksMap((prev) => {
      const prevList = prev[dueKey] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const list = taskList.map((t) => {
        if (t.id !== parentTask.id) return t;
        const currentSubtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
        const newSubtasks = currentSubtasks.map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        );
        // Parent is done if and only if all subtasks are done (when any subtasks exist)
        const hasSubtasks = newSubtasks.length > 0;
        const allSubsDone = hasSubtasks ? newSubtasks.every((st) => st.done) : true;
        const parentDone = hasSubtasks ? allSubsDone : t.done;
        return { ...t, subtasks: newSubtasks, done: parentDone };
      });

      const prevAllDone = taskList.length > 0 && taskList.every((t) => t.done);
      const newAllDone = list.length > 0 && list.every((t) => t.done);
      if (!prevAllDone && newAllDone) {
        triggerCelebration(dueKey);
        if (dueKey === todayKey()) {
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: todayKey() };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (prevAllDone && !newAllDone) {
        if (dueKey === todayKey()) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== todayKey()) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }

      const sortedTasks = sortTasksByCreatedDesc(list);
      const fullList = mergeDayList(sortedTasks, noteItem);
      const updated = { ...prev, [dueKey]: fullList };
      if (user && taskRepoRef.current) {
        const updatedTask = list.find(t => t.id === parentTask.id);
        if (updatedTask) taskRepoRef.current.saveTask(dueKey, updatedTask).catch((err) => console.error('Cloud toggleSubtask failed', err));
      }
      return updated;
    });
  }

  function deleteSubtask(parentTask, subtaskId) {
    if (!parentTask || !subtaskId) return;
    const dueKey = parentTask.due;
    setTasksMap((prev) => {
      const prevList = prev[dueKey] || [];
      const { taskList, noteItem } = splitDayList(prevList);
      const list = taskList.map((t) => {
        if (t.id !== parentTask.id) return t;
        const currentSubtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
        const newSubtasks = currentSubtasks.filter((st) => st.id !== subtaskId);
        const hasSubtasks = newSubtasks.length > 0;
        const allSubsDone = hasSubtasks ? newSubtasks.every((st) => st.done) : true;
        const parentDone = hasSubtasks ? allSubsDone : t.done;
        return { ...t, subtasks: newSubtasks, done: parentDone };
      });

      const prevAllDone = taskList.length > 0 && taskList.every((t) => t.done);
      const newAllDone = list.length > 0 && list.every((t) => t.done);
      if (!prevAllDone && newAllDone) {
        triggerCelebration(dueKey);
        if (dueKey === todayKey()) {
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: todayKey() };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (prevAllDone && !newAllDone) {
        if (dueKey === todayKey()) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== todayKey()) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }

      const sortedTasks = sortTasksByCreatedDesc(list);
      const fullList = mergeDayList(sortedTasks, noteItem);
      const updated = { ...prev, [dueKey]: fullList };
      if (user && taskRepoRef.current) {
        const updatedTask = list.find(t => t.id === parentTask.id);
        if (updatedTask) taskRepoRef.current.saveTask(dueKey, updatedTask).catch((err) => console.error('Cloud deleteSubtask failed', err));
      }
      return updated;
    });
  }

  // Drag and drop: move task between days
  // drag mime moved to constants

  function moveTask(fromKey, taskId, toKey) {
    if (!fromKey || !taskId || !toKey || fromKey === toKey) return;
    setTasksMap((prev) => {
      const fromList = prev[fromKey] || [];
      const { taskList: fromTasks, noteItem: fromNote } = splitDayList(fromList);
      const task = fromTasks.find((t) => t.id === taskId);
      if (!task) return prev;
      const updatedFromTasks = fromTasks.filter((t) => t.id !== taskId);
      const sortedFromTasks = sortTasksByCreatedDesc(updatedFromTasks);
      const fullFromList = mergeDayList(sortedFromTasks, fromNote);
      const toList = prev[toKey] || [];
      const { taskList: toTasks, noteItem: toNote } = splitDayList(toList);
      const movedTask = { ...task, due: toKey };
      const newToTasks = sortTasksByCreatedDesc([movedTask, ...toTasks]);
      const fullToList = mergeDayList(newToTasks, toNote);
      const updated = { ...prev, [toKey]: fullToList };
      if (fullFromList.length) updated[fromKey] = fullFromList; else delete updated[fromKey];

      // Handle completion transitions for streak if today is affected
      const prevFromAllDone = fromTasks.length > 0 && fromTasks.every((t) => t.done);
      const newFromAllDone = updatedFromTasks.length > 0 && updatedFromTasks.every((t) => t.done);
      const prevToAllDone = toTasks.length > 0 && toTasks.every((t) => t.done);
      const newToAllDone = ([movedTask, ...toTasks]).length > 0 && [movedTask, ...toTasks].every((t) => t.done);
      const tKey = todayKey();
      if (fromKey === tKey) {
        if (!prevFromAllDone && newFromAllDone) {
          triggerCelebration(fromKey);
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: tKey };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
        if (prevFromAllDone && !newFromAllDone) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== tKey) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (toKey === tKey) {
        if (!prevToAllDone && newToAllDone) {
          triggerCelebration(toKey);
          setStreak((s) => {
            const y = yesterdayKey();
            const nextCurrent = s?.lastEarnedDateKey === y ? (Number(s?.current) || 0) + 1 : 1;
            const nextLongest = Math.max(Number(s?.longest) || 0, nextCurrent);
            const next = { current: nextCurrent, longest: nextLongest, lastEarnedDateKey: tKey };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
        if (prevToAllDone && !newToAllDone) {
          setStreak((s) => {
            if (s?.lastEarnedDateKey !== tKey) return s;
            const decreased = Math.max(0, (Number(s?.current) || 0) - 1);
            const newLast = decreased > 0 ? yesterdayKey() : null;
            const next = { current: decreased, longest: Number(s?.longest) || 0, lastEarnedDateKey: newLast };
            if (user) saveStreakToCloud(user.uid, next).catch(() => {});
            return next;
          });
        }
      }
      if (user && taskRepoRef.current) {
        try {
          // Persist changes: delete from original day and upsert to new day
          taskRepoRef.current.updateTaskDueDate(taskId, toKey).catch((err) => console.error('Cloud moveTask failed', err));
        } catch (err) {
          console.error('Cloud moveTask error', err);
        }
      }
      return updated;
    });
  }

  function onDragStartTask(e, task) {
    try {
      e.dataTransfer.effectAllowed = 'move';
      const payload = JSON.stringify({ taskId: task.id, fromKey: task.due });
      e.dataTransfer.setData(DRAG_MIME, payload);
      // Fallback for some browsers/tools
      e.dataTransfer.setData('text/plain', payload);
    } catch {}
  }

  function onDropTaskOnDay(e, day) {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const { taskId, fromKey } = JSON.parse(raw || '{}');
      const toKey = keyFor(day);
      moveTask(fromKey, taskId, toKey);
      setDragOverDayKey(null);
    } catch {}
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(tasksMap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "caldo-tasks.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        // shallow merge
        setTasksMap((prev) => {
          const merged = { ...prev, ...parsed };
          // Bulk sync all months to cloud if signed in
          if (user && taskRepoRef.current && noteRepoRef.current) {
            const months = new Set(Object.keys(merged).map((k) => monthKeyFromDateKey(k)));
            months.forEach((m) => {
              const monthMap = getMonthMapFor(merged, m);
              Object.entries(monthMap).forEach(([dateKey, dayList]) => {
                if (Array.isArray(dayList)) {
                  const { taskList, noteItem } = splitDayList(dayList);
                  taskList.forEach(t => taskRepoRef.current.saveTask(dateKey, t).catch(() => {}));
                  if (noteItem?.dayNote) noteRepoRef.current.saveDayNote(dateKey, noteItem.dayNote).catch(() => {});
                }
              });
            });
          }
          return merged;
        });
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  function clearAll() {
    if (!confirm("Clear all tasks?")) return;
    const prevSnapshot = tasksMap;
    setTasksMap(() => ({}));
    // Fire and forget cloud cleanup
    if (user && taskRepoRef.current) {
      (async () => {
        try {
          const years = Array.from(new Set(Object.keys(prevSnapshot).map(k => k.slice(0, 4))));
          await Promise.all(
            years.map((year) => {
              const start = new Date(Number(year), 0, 1);
              const end = new Date(Number(year) + 1, 0, 1);
              return taskRepoRef.current.deleteTasksInRange(start, end);
            })
          );
        } catch (e) {
          console.error('Cloud clear failed', e);
        }
      })();
    }
    setStreak({ current: 0, longest: Number(streak?.longest) || 0, lastEarnedDateKey: null });
    if (user) saveStreakToCloud(user.uid, { current: 0, longest: Number(streak?.longest) || 0, lastEarnedDateKey: null }).catch(() => {});
  }

  // Keep streak valid across day changes: if last earned day is neither today nor yesterday, reset current to 0
  useEffect(() => {
    function checkAndResetIfBroken() {
      setStreak((s) => ensureStreakUpToDate(s));
    }
    // Run on mount
    checkAndResetIfBroken();
    // Check periodically and at approximate midnight
    const intervalId = setInterval(checkAndResetIfBroken, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-10 safe-pt safe-pb font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto">
        <Header user={user} onSignInWithGoogle={signInWithGoogle} onSignOut={signOut} onExportJSON={exportJSON} onImportJSON={importJSON} onOpenHelp={() => setShowHelp(true)} onOpenSearch={() => setShowSearch(true)} currentStreak={streak?.current || 0} />
        

        <main className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Calendar
            monthStart={monthStart}
            monthDays={monthDays}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setCursor(d);
              setSelectedDate(d);
              if (user) {
                const dk = keyFor(d);
                // Fetch the clicked day's tasks in the background and merge
                refreshDayFromCloud(user.uid, dk);
              }
              try {
                setDraftDayNote(getDayNoteByKey(keyFor(d)));
              } catch {}
            }}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            tasksFor={tasksFor}
            hasNoteFor={hasNoteForDay}
            onOpenAddModal={openAddModal}
            dragOverDayKey={dragOverDayKey}
            setDragOverDayKey={setDragOverDayKey}
            onDropTaskOnDay={onDropTaskOnDay}
            missedCount={missedTasksThisMonth.length}
            onOpenMissed={() => setShowMissed(true)}
          />

          <aside className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Tasks for</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{format(selectedDate, 'EEEE, MMM d')}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotes(true)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-center"
                  aria-label="Open notes (N)"
                  title="Open notes (N)"
                >
                  <StickyNote size={16} />
                </button>
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="bg-indigo-600 text-white p-2 rounded-lg inline-flex items-center justify-center"
                  aria-label="Add task (T)"
                  title="Add task (T)"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>


            <TaskList
              tasks={tasksFor(selectedDate)}
              onDragStartTask={onDragStartTask}
              onToggleDone={toggleDone}
              onOpenEditModal={openEditModal}
              onDeleteTask={deleteTask}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onDeleteSubtask={deleteSubtask}
            />
          </aside>
        </main>

        {showCelebration && (
          <div className="pointer-events-none fixed inset-0 z-[60]">
            <CelebrationCanvas seed={confettiSeed} />
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-auto fixed top-4 right-4 z-[61]">
              <div className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg text-[12px] sm:text-sm font-semibold text-green-700 dark:text-green-300 border border-green-100 dark:border-green-900/40 inline-flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span>All tasks done for {celebrationDateKey ? format(parseISO(celebrationDateKey), 'EEE, MMM d') : ''}</span>
              </div>
            </motion.div>
          </div>
        )}

        <AddTaskDrawer open={showAdd} selectedDate={selectedDate} form={form} setForm={setForm} onSubmit={addTask} onClose={() => setShowAdd(false)} />
        <EditTaskModal open={showEdit} editForm={editForm} setEditForm={setEditForm} onSubmit={saveEdit} onClose={() => setShowEdit(false)} />
        <MissedTasksDrawer
          open={showMissed}
          count={missedTasksThisMonth.length}
          tasks={missedTasksThisMonth}
          onClose={() => setShowMissed(false)}
          onDragStartTask={onDragStartTask}
          onToggleDone={toggleDone}
          onOpenEditModal={openEditModal}
          onDeleteTask={deleteTask}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
        />

        <DayNotesDrawer
          open={showNotes}
          dateLabel={format(selectedDate, 'PPP')}
          value={draftDayNote}
          onChange={setDraftDayNote}
          onSave={async () => {
            try {
              setNotesSaving(true);
              await saveDayNoteForKey(keyFor(selectedDate), draftDayNote);
              setNotesJustSaved(true);
              setTimeout(() => setNotesJustSaved(false), 900);
            } finally {
              setNotesSaving(false);
            }
          }}
          saving={notesSaving}
          justSaved={notesJustSaved}
          onClose={() => {
            setShowNotes(false);
          }}
        />

        <HelpPage open={showHelp || (typeof window !== 'undefined' && window.location.hash === '#help')} onClose={() => { setShowHelp(false); try { if (window.location.hash === '#help') history.replaceState(null, '', location.pathname + location.search); } catch {} }} />

        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          searchResults={searchResults}
          onNavigateToItem={navigateToSearchResult}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />

        <footer className="mt-6 text-center text-sm text-slate-400 dark:text-slate-500">Imagined by Human, Built by AI.</footer>
      </div>
    </div>
  );
}
