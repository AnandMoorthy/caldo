export const STORAGE_KEY = "caldo_v2_tasks";
export const STREAK_KEY = "caldo_v2_streak";

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveTasks(tasksMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksMap));
}

export function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, longest: 0, lastEarnedDateKey: null };
    const parsed = JSON.parse(raw);
    return {
      current: Number(parsed.current) || 0,
      longest: Number(parsed.longest) || 0,
      lastEarnedDateKey: parsed.lastEarnedDateKey || null,
    };
  } catch {
    return { current: 0, longest: 0, lastEarnedDateKey: null };
  }
}

export function saveStreak(streak) {
  const safe = {
    current: Number(streak?.current) || 0,
    longest: Number(streak?.longest) || 0,
    lastEarnedDateKey: streak?.lastEarnedDateKey || null,
  };
  localStorage.setItem(STREAK_KEY, JSON.stringify(safe));
}


