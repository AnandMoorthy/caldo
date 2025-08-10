export const STORAGE_KEY = "caldo_v2_tasks";

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


