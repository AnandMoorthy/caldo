import React, { useEffect, useMemo, useState, useRef } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, FileUp as ImportIcon, FileDown as ExportIcon, User as UserIcon, ChevronDown, Pencil, Check, RotateCcw, Trash, Clock } from "lucide-react";
import { auth, db, googleProvider } from "./firebase";


// Single-file Caldo app
// Tailwind styling expected. NPM deps: date-fns, framer-motion, lucide-react

const STORAGE_KEY = "caldo_v2_tasks";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return {};
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(monthStart);
  const [dragOverDayKey, setDragOverDayKey] = useState(null);

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

  // Lightweight confetti canvas
  function CelebrationCanvas() {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const particlesRef = useRef([]);
    const startedAtRef = useRef(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let animationFrame = 0;
      let width = canvas.width = window.innerWidth * window.devicePixelRatio;
      let height = canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      function onResize() {
        width = canvas.width = window.innerWidth * window.devicePixelRatio;
        height = canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
      window.addEventListener('resize', onResize);

      const colors = ['#22c55e', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7'];
      const particleCount = Math.min(180, Math.floor((window.innerWidth * window.innerHeight) / 8000));

      function spawnParticles() {
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI - Math.PI / 2;
          const speed = 4 + Math.random() * 6;
          particles.push({
            x: width / 2 + (Math.random() - 0.5) * (width * 0.3),
            y: height * 0.2 + Math.random() * (height * 0.15),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            g: 0.18 + Math.random() * 0.12,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 10,
            r: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.2,
            color: colors[i % colors.length],
            life: 0,
            maxLife: 120 + Math.random() * 60,
          });
        }
        particlesRef.current = particles;
      }

      function drawParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      function step(ts) {
        if (!startedAtRef.current) startedAtRef.current = ts;
        ctx.clearRect(0, 0, width, height);
        for (const p of particlesRef.current) {
          p.vy += p.g;
          p.x += p.vx;
          p.y += p.vy;
          p.r += p.vr;
          p.life += 1;
          drawParticle(p);
        }
        particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife && p.y < height + 40);
        animationFrame = requestAnimationFrame(step);
      }

      spawnParticles();
      animationFrame = requestAnimationFrame(step);

      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', onResize);
      };
    }, [confettiSeed]);

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[60]"
        aria-hidden="true"
      />
    );
  }

  // Helpers for month-based docs used in the old app
  function monthKeyFromDate(date) {
    return format(date, 'yyyy-MM');
  }
  function monthKeyFromDateKey(dateKey) {
    // dateKey is yyyy-MM-dd
    return dateKey.slice(0, 7);
  }
  function getMonthMapFor(tasksMapArg, monthKey) {
    const out = {};
    for (const k of Object.keys(tasksMapArg)) {
      if (k.startsWith(monthKey + '-')) out[k] = tasksMapArg[k];
    }
    return out;
  }

  async function saveMonthToCloud(userId, monthKey, monthMap) {
    const docRef = db.collection('users').doc(userId).collection('todos').doc(monthKey);
    // store under a field name for compatibility; prefer 'todos'
    await docRef.set({ todos: monthMap, updatedAt: new Date() }, { merge: true });
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
        } catch (e) {
          console.error('Failed to load from cloud', e);
        }
      } else {
        hasLoadedCloud.current = false;
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

  // Close profile menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function renderAvatar() {
    const getInitials = () => {
      const name = user?.displayName?.trim();
      if (name) {
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        if (parts.length === 1) return (parts[0].slice(0, 2)).toUpperCase();
      }
      const email = user?.email || '';
      const local = email.split('@')[0] || '';
      if (local.length >= 2) return local.slice(0, 2).toUpperCase();
      if (local.length === 1) return (local[0] + local[0]).toUpperCase();
      return '?';
    };
    return (
      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
        {getInitials()}
      </div>
    );
  }

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

  function keyFor(date) {
    return format(date, "yyyy-MM-dd");
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
  const DRAG_MIME = 'application/x-caldo-task';

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
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-10 safe-pt safe-pb font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CalDo</h1>
            <p className="text-sm text-slate-500 mt-1">Minimalist calendar & todo.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setShowProfileMenu((v) => !v)} className="btn inline-flex items-center gap-2">
                {renderAvatar()}
                <ChevronDown size={16} />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-lg p-2 z-50">
                  <div className="px-2 py-1.5 text-xs text-slate-500">
                    {user ? (
                      <span>Signed in as <span className="font-medium text-slate-700">{user.displayName || user.email}</span></span>
                    ) : (
                      <span>Not signed in</span>
                    )}
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  {!user && (
                    <button onClick={signInWithGoogle} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 inline-flex items-center gap-2">
                      <UserIcon size={16} /> Sign in with Google
                    </button>
                  )}
                  <button onClick={exportJSON} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 inline-flex items-center gap-2">
                    <ExportIcon size={16} /> Export
                  </button>
                  <label className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 inline-flex items-center gap-2 cursor-pointer">
                    <ImportIcon size={16} /> Import
                    <input type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files[0])} />
                  </label>
                  {user && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <button onClick={signOut} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50">Sign out</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <section className="md:col-span-2 bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Previous month">
                  <ChevronLeft size={18} />
                </button>
                <div className="text-lg font-semibold w-44 sm:w-56 text-center select-none">{format(monthStart, "MMMM yyyy")}</div>
                <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Next month">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { const d = new Date(); setCursor(d); setSelectedDate(d); }} className="text-sm px-3 py-2 rounded-lg bg-slate-50">Today</button>
                {/* <button onClick={() => openAddModal(new Date())} className="bg-indigo-600 text-white px-3 py-2 rounded-lg inline-flex items-center gap-2">
                  <Plus size={14} /> Add Task
                </button> */}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="text-[10px] sm:text-xs text-slate-500 text-center py-2">{d}</div>
              ))}

              {monthDays.map((day) => {
                const key = keyFor(day);
                const tasks = tasksFor(day);
                const doneCount = tasks.filter(t => t.done).length;
                const inMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                const baseBg = inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400';
                const ringClass = dragOverDayKey === key
                  ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-white'
                  : isSelected
                  ? 'ring-2 ring-indigo-500'
                  : isToday
                  ? 'ring-2 ring-indigo-300'
                  : '';
                const selectedBg = isSelected ? 'bg-indigo-50' : '';
                return (
                  <motion.div
                    key={key}
                    layout
                    onDoubleClick={() => openAddModal(day)}
                    onClick={() => setSelectedDate(day)}
                    onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {}; setDragOverDayKey(key); }}
                    onDragEnter={() => setDragOverDayKey(key)}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDayKey((k) => (k === key ? null : k)); }}
                    onDrop={(e) => onDropTaskOnDay(e, day)}
                    aria-selected={isSelected}
                    className={`border rounded-lg p-1 sm:p-2 min-h-[56px] sm:min-h-[88px] cursor-pointer relative ${baseBg} ${selectedBg} ${ringClass}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={isSelected ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 text-white text-[11px] sm:text-xs flex items-center justify-center font-semibold' : 'text-xs sm:text-sm font-medium'}>
                        {format(day, 'd')}
                      </div>
                      <div className="hidden sm:block text-xs text-slate-400">{format(day, 'MMM')}</div>
                    </div>
                    {/* Option 1 (hidden): numeric badge – kept for later selection */}
                    {tasks.length > 0 && (
                      <div
                        className={`hidden absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          doneCount === 0
                            ? 'bg-red-100 text-red-700'
                            : doneCount === tasks.length
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                        title={`${doneCount}/${tasks.length} done`}
                      >
                        {tasks.length}
                      </div>
                    )}

                    {/* Option 2 (active): dot progression indicator */}
                    {tasks.length > 0 && (
                      <div
                        className="absolute bottom-1 right-1 flex items-center gap-0.5"
                        title={`${doneCount}/${tasks.length} done`}
                      >
                        {Array.from({ length: Math.min(3, tasks.length) }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`${
                              doneCount === 0
                                ? 'bg-red-400'
                                : doneCount === tasks.length
                                ? 'bg-green-500'
                                : 'bg-amber-400'
                            } inline-block w-1.5 h-1.5 rounded-full`}
                          />
                        ))}
                        {tasks.length > 3 && (
                          <span className="text-[9px] leading-none text-slate-400 ml-0.5">+{tasks.length - 3}</span>
                        )}
                      </div>
                    )}
                    {/* Selected indicator handled by ring + date bubble */}
                  </motion.div>
                );
              })}
            </div>
          </section>

          <aside className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-slate-500">Tasks for</div>
                <div className="font-semibold">{format(selectedDate, 'EEEE, MMM d')}</div>
              </div>
              <button onClick={() => openAddModal(selectedDate)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg inline-flex items-center gap-2">
                <Plus size={14} /> New
              </button>
            </div>

            <div className="space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-auto pr-2">
              {tasksFor(selectedDate).length === 0 && (
                <div className="text-sm text-slate-400">No tasks. Double-click any day to add one quickly.</div>
              )}

              {tasksFor(selectedDate).map((t) => {
                const priorityBorder = t.priority === 'high'
                  ? 'border-red-300 border-l-4'
                  : t.priority === 'low'
                  ? 'border-green-300 border-l-4'
                  : 'border-amber-300 border-l-4';
                const priorityPill = t.priority === 'high'
                  ? 'bg-red-100 text-red-700'
                  : t.priority === 'low'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700';
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 sm:p-3 border rounded-lg ${priorityBorder} cursor-grab active:cursor-grabbing`}
                    draggable
                    onDragStart={(e) => onDragStartTask(e, t)}
                    title={`${t.title}${t.notes ? '\n' + t.notes : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-medium ${t.done ? 'line-through text-slate-400':''} truncate min-w-0`}>
                        {t.title}
                      </div>
                      <div className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${priorityPill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.priority==='high' ? 'bg-red-600' : t.priority==='low' ? 'bg-green-600' : 'bg-amber-600'}`} />
                        {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                      </div>
                    </div>
                    {t.notes && <div className="text-[11px] text-slate-600 mt-1 break-words clamp-2">{t.notes}</div>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock size={12} /> {format(parseISO(t.createdAt), 'PP p')}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleDone(t)}
                          className={`p-2 rounded-lg border hover:bg-slate-50 ${t.done ? 'text-slate-600 border-slate-200' : 'text-green-600 border-slate-200'}`}
                          title={t.done ? 'Undo' : 'Mark done'}
                          aria-label={t.done ? 'Undo' : 'Mark done'}
                        >
                          {t.done ? <RotateCcw size={16} /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-indigo-600"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteTask(t)}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </aside>
        </main>

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="pointer-events-none fixed inset-0 z-[60]">
            <CelebrationCanvas key={`confetti-${confettiSeed}`} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto fixed top-4 right-4 z-[61]"
            >
              <div className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-full bg-white/90 backdrop-blur shadow-lg text-[12px] sm:text-sm font-semibold text-green-700 border border-green-100 inline-flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span>
                  All tasks done for {celebrationDateKey ? format(parseISO(celebrationDateKey), 'EEE, MMM d') : ''}
                </span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
            <motion.form initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={addTask} className="relative bg-white rounded-2xl shadow-lg p-6 z-50 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">New Task — {format(selectedDate, 'PPP')}</div>
                <button type="button" onClick={() => setShowAdd(false)} className="text-slate-500">Close</button>
              </div>

              <div className="grid gap-3">
                <input required autoFocus value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))} placeholder="Task title" className="input" />
                <textarea rows={3} value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} placeholder="Notes (optional)" className="input resize-none" />

                <div className="flex items-center gap-2">
                  <label className={`px-3 py-1 rounded cursor-pointer ${form.priority==='low' ? 'bg-green-100':'bg-slate-50'}`}><input type="radio" name="p" checked={form.priority==='low'} onChange={() => setForm(f => ({...f, priority: 'low'}))} className="hidden" /> Low</label>
                  <label className={`px-3 py-1 rounded cursor-pointer ${form.priority==='medium' ? 'bg-amber-100':'bg-slate-50'}`}><input type="radio" name="p" checked={form.priority==='medium'} onChange={() => setForm(f => ({...f, priority: 'medium'}))} className="hidden" /> Medium</label>
                  <label className={`px-3 py-1 rounded cursor-pointer ${form.priority==='high' ? 'bg-red-100':'bg-slate-50'}`}><input type="radio" name="p" checked={form.priority==='high'} onChange={() => setForm(f => ({...f, priority: 'high'}))} className="hidden" /> High</label>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Add</button>
                </div>
              </div>
            </motion.form>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEdit && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
            <motion.form initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onSubmit={saveEdit} className="relative bg-white rounded-2xl shadow-lg p-6 z-50 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Edit Task</div>
                <button type="button" onClick={() => setShowEdit(false)} className="text-slate-500">Close</button>
              </div>

              <div className="grid gap-3">
                <input required autoFocus value={editForm.title} onChange={(e) => setEditForm(f => ({...f, title: e.target.value}))} placeholder="Task title" className="input" />
                <textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm(f => ({...f, notes: e.target.value}))} placeholder="Notes (optional)" className="input resize-none" />

                <div className="flex items-center gap-2">
                  <label className={`px-3 py-1 rounded cursor-pointer ${editForm.priority==='low' ? 'bg-green-100':'bg-slate-50'}`}><input type="radio" name="ep" checked={editForm.priority==='low'} onChange={() => setEditForm(f => ({...f, priority: 'low'}))} className="hidden" /> Low</label>
                  <label className={`px-3 py-1 rounded cursor-pointer ${editForm.priority==='medium' ? 'bg-amber-100':'bg-slate-50'}`}><input type="radio" name="ep" checked={editForm.priority==='medium'} onChange={() => setEditForm(f => ({...f, priority: 'medium'}))} className="hidden" /> Medium</label>
                  <label className={`px-3 py-1 rounded cursor-pointer ${editForm.priority==='high' ? 'bg-red-100':'bg-slate-50'}`}><input type="radio" name="ep" checked={editForm.priority==='high'} onChange={() => setEditForm(f => ({...f, priority: 'high'}))} className="hidden" /> High</label>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
                </div>
              </div>
            </motion.form>
          </div>
        )}

        <footer className="mt-6 text-center text-sm text-slate-400">Imagined by Human, Built by AI.</footer>
      </div>

      {/* tiny utilities styles in page, assuming Tailwind is present */}
      <style>{`
        .btn{padding:.5rem .75rem;border-radius:.5rem;background:transparent;border:1px solid rgba(15,23,42,.06)}
        .btn.ghost{background:transparent}
        .input{padding:.6rem .75rem;border:1px solid #e6e9ee;border-radius:.5rem}
        .clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      `}</style>
      {/* Confetti canvas component injected at end of tree */}
      
    </div>
  );
}
