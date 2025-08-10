import React, { useEffect, useMemo, useState, useRef } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { auth, db, googleProvider } from "./firebase";
import Header from "./components/Header.jsx";
import Calendar from "./components/Calendar.jsx";
import TaskList from "./components/TaskList.jsx";
import AddTaskModal from "./components/modals/AddTaskModal.jsx";
import EditTaskModal from "./components/modals/EditTaskModal.jsx";
import CelebrationCanvas from "./components/CelebrationCanvas.jsx";
import { loadTasks, saveTasks, loadStreak, saveStreak } from "./utils/storage";
import { uid } from "./utils/uid";
import { keyFor, monthKeyFromDate, monthKeyFromDateKey, getMonthMapFor } from "./utils/date";
import { DRAG_MIME } from "./constants";


// Single-file Caldo app
// Tailwind styling expected. NPM deps: date-fns, framer-motion, lucide-react

// Storage helpers moved to utils/storage.js

export default function App() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksMap, setTasksMap] = useState(() => loadTasks());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", notes: "", priority: "medium" });
  const [showEdit, setShowEdit] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", notes: "", priority: "medium" });
  const [user, setUser] = useState(null);
  const hasLoadedCloud = useRef(false);
  // profile menu moved into Header component
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(monthStart);
  const [dragOverDayKey, setDragOverDayKey] = useState(null);

  // Streak state: current, longest, lastEarnedDateKey
  const [streak, setStreak] = useState(() => loadStreak());
  // no-op ref removed; we use interval-based checker

  // Celebration state and bookkeeping
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDateKey, setCelebrationDateKey] = useState(null);
  const celebrationTimerRef = useRef(null);
  const [confettiSeed, setConfettiSeed] = useState(0);

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

  useEffect(() => {
    saveStreak(streak);
  }, [streak]);

  // celebration canvas moved to component

  // date helpers moved to utils/date.js

  async function saveMonthToCloud(userId, monthKey, monthMap) {
    const docRef = db.collection('users').doc(userId).collection('todos').doc(monthKey);
    // store under a field name for compatibility; prefer 'todos'
    await docRef.set({ todos: monthMap, updatedAt: new Date() }, { merge: true });
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
        // Load all months from Firestore and merge with local
        try {
          const colRef = db.collection('users').doc(u.uid).collection('todos');
          const querySnap = await colRef.get();
          let cloudCombined = {};
          querySnap.forEach((doc) => {
            const data = doc.data() || {};
            const monthMap = data.todos || data.tasksMap || data.dates || {};
            cloudCombined = mergeTasksMaps(cloudCombined, monthMap);
          });
          const merged = mergeTasksMaps(tasksMap, cloudCombined);
          hasLoadedCloud.current = true;
          setTasksMap(merged);
          // If user had only local data, seed current month to cloud for immediate consistency
          const currentMonthKey = monthKeyFromDate(new Date());
          const currentMonthMap = getMonthMapFor(merged, currentMonthKey);
          await saveMonthToCloud(u.uid, currentMonthKey, currentMonthMap);

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
          console.error('Failed to load from cloud', e);
        }
      } else {
        hasLoadedCloud.current = false;
        setStreak((s) => ensureStreakUpToDate(s));
      }
    });
    return () => unsub();
  }, []);

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
          // prefer the most recently created/updated looking fields
          byId.set(t.id, { ...t, ...existing });
        }
      }
      const mergedList = Array.from(byId.values());
      if (mergedList.length) result[dateKey] = mergedList;
    }
    return result;
  }

  async function signInWithGoogle() {
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (e) {
      alert('Sign-in failed');
      console.error(e);
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

  function tasksFor(date) {
    return tasksMap[keyFor(date)] || [];
  }

  function openAddModal(date) {
    setSelectedDate(date);
    setForm({ title: "", notes: "", priority: "medium" });
    setShowAdd(true);
  }

  function addTask(e) {
    e.preventDefault();
    const key = keyFor(selectedDate);
    const newTask = {
      id: uid(),
      title: form.title || "Untitled",
      notes: form.notes || "",
      done: false,
      priority: form.priority || "medium",
      due: key,
      createdAt: new Date().toISOString(),
    };
    setTasksMap((prev) => {
      const prevList = prev[key] || [];
      const updatedList = [newTask, ...prevList];
      const prevAllDone = prevList.length > 0 && prevList.every((t) => t.done);
      const newAllDone = updatedList.length > 0 && updatedList.every((t) => t.done);
      // Adding a new incomplete task should not trigger; guard by checking prev->new transition
      const updated = { ...prev, [key]: updatedList };
      // Also persist month to cloud if signed in
      if (user) {
        const monthKey = monthKeyFromDateKey(key);
        const monthMap = getMonthMapFor(updated, monthKey);
        saveMonthToCloud(user.uid, monthKey, monthMap).catch((err) => console.error('Cloud addTask failed', err));
      }
      return updated;
    });
    setShowAdd(false);
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
      const list = (prev[editTask.due] || []).map((t) =>
        t.id === editTask.id
          ? { ...t, title: editForm.title || 'Untitled', notes: editForm.notes || '', priority: editForm.priority || 'medium' }
          : t
      );
      const updated = { ...prev, [editTask.due]: list };
      if (user) {
        const monthKey = monthKeyFromDateKey(editTask.due);
        const monthMap = getMonthMapFor(updated, monthKey);
        saveMonthToCloud(user.uid, monthKey, monthMap).catch((err) => console.error('Cloud saveEdit failed', err));
      }
      return updated;
    });
    setShowEdit(false);
    setEditTask(null);
  }

  function toggleDone(task) {
    setTasksMap((prev) => {
      const prevList = prev[task.due] || [];
      const list = prevList.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t));
      const prevAllDone = prevList.length > 0 && prevList.every((t) => t.done);
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
      const updated = { ...prev, [task.due]: list };
      if (user) {
        const monthKey = monthKeyFromDateKey(task.due);
        const monthMap = getMonthMapFor(updated, monthKey);
        saveMonthToCloud(user.uid, monthKey, monthMap).catch((err) => console.error('Cloud toggleDone failed', err));
      }
      return updated;
    });
  }

  function deleteTask(task) {
    setTasksMap((prev) => {
      const prevList = prev[task.due] || [];
      const list = prevList.filter((t) => t.id !== task.id);
      const prevAllDone = prevList.length > 0 && prevList.every((t) => t.done);
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
      if (list.length) copy[task.due] = list;
      else delete copy[task.due];
      if (user) {
        const monthKey = monthKeyFromDateKey(task.due);
        const monthMap = getMonthMapFor(copy, monthKey);
        saveMonthToCloud(user.uid, monthKey, monthMap).catch((err) => console.error('Cloud deleteTask failed', err));
      }
      return copy;
    });
  }

  // Drag and drop: move task between days
  // drag mime moved to constants

  function moveTask(fromKey, taskId, toKey) {
    if (!fromKey || !taskId || !toKey || fromKey === toKey) return;
    setTasksMap((prev) => {
      const fromList = prev[fromKey] || [];
      const task = fromList.find((t) => t.id === taskId);
      if (!task) return prev;
      const updatedFromList = fromList.filter((t) => t.id !== taskId);
      const toList = prev[toKey] || [];
      const movedTask = { ...task, due: toKey };
      const updated = { ...prev, [toKey]: [movedTask, ...toList] };
      if (updatedFromList.length) updated[fromKey] = updatedFromList; else delete updated[fromKey];

      // Handle completion transitions for streak if today is affected
      const prevFromAllDone = fromList.length > 0 && fromList.every((t) => t.done);
      const newFromAllDone = updatedFromList.length > 0 && updatedFromList.every((t) => t.done);
      const prevToAllDone = toList.length > 0 && toList.every((t) => t.done);
      const newToAllDone = ([movedTask, ...toList]).length > 0 && [movedTask, ...toList].every((t) => t.done);
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
      if (user) {
        try {
          const fromMonthKey = monthKeyFromDateKey(fromKey);
          const toMonthKey = monthKeyFromDateKey(toKey);
          const fromMonthMap = getMonthMapFor(updated, fromMonthKey);
          const toMonthMap = getMonthMapFor(updated, toMonthKey);
          saveMonthToCloud(user.uid, fromMonthKey, fromMonthMap).catch((err) => console.error('Cloud moveTask(from) failed', err));
          if (toMonthKey !== fromMonthKey) {
            saveMonthToCloud(user.uid, toMonthKey, toMonthMap).catch((err) => console.error('Cloud moveTask(to) failed', err));
          }
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
          if (user) {
            const months = new Set(Object.keys(merged).map((k) => monthKeyFromDateKey(k)));
            months.forEach((m) => {
              const monthMap = getMonthMapFor(merged, m);
              saveMonthToCloud(user.uid, m, monthMap).catch((err) => console.error('Cloud import sync failed', err));
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
    setTasksMap((prev) => {
      const months = new Set(Object.keys(prev).map((k) => monthKeyFromDateKey(k)));
      if (user) {
        months.forEach(async (m) => {
          try {
            await saveMonthToCloud(user.uid, m, {});
          } catch (e) {
            console.error('Cloud clear month failed', e);
          }
        });
      }
      return {};
    });
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
        <Header user={user} onSignInWithGoogle={signInWithGoogle} onSignOut={signOut} onExportJSON={exportJSON} onImportJSON={importJSON} currentStreak={streak?.current || 0} />
        

        <main className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Calendar
            monthStart={monthStart}
            monthDays={monthDays}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setCursor(d);
              setSelectedDate(d);
            }}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            tasksFor={tasksFor}
            onOpenAddModal={openAddModal}
            dragOverDayKey={dragOverDayKey}
            setDragOverDayKey={setDragOverDayKey}
            onDropTaskOnDay={onDropTaskOnDay}
          />

          <aside className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Tasks for</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{format(selectedDate, 'EEEE, MMM d')}</div>
              </div>
              <button onClick={() => openAddModal(selectedDate)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg inline-flex items-center gap-2">
                <Plus size={14} /> New
              </button>
            </div>

            <TaskList
              tasks={tasksFor(selectedDate)}
              onDragStartTask={onDragStartTask}
              onToggleDone={toggleDone}
              onOpenEditModal={openEditModal}
              onDeleteTask={deleteTask}
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

        <AddTaskModal open={showAdd} selectedDate={selectedDate} form={form} setForm={setForm} onSubmit={addTask} onClose={() => setShowAdd(false)} />
        <EditTaskModal open={showEdit} editForm={editForm} setEditForm={setEditForm} onSubmit={saveEdit} onClose={() => setShowEdit(false)} />

        <footer className="mt-6 text-center text-sm text-slate-400 dark:text-slate-500">Imagined by Human, Built by AI.</footer>
      </div>
    </div>
  );
}
