export function taskTimeMs(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate().getTime() || 0;
    } catch {
      return 0;
    }
  }
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Incomplete first (newest on top); completed after last unfinished (most recently completed first). */
export function sortTasksForDay(list) {
  return [...(list || [])].sort((a, b) => {
    const aDone = !!a.done;
    const bDone = !!b.done;
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (!aDone) return taskTimeMs(b.createdAt) - taskTimeMs(a.createdAt);
    const bCompleted = taskTimeMs(b.completedAt) || taskTimeMs(b.createdAt);
    const aCompleted = taskTimeMs(a.completedAt) || taskTimeMs(a.createdAt);
    return bCompleted - aCompleted;
  });
}

/** Apply done + completedAt stamp when a task transitions complete/incomplete. */
export function withCompletionStamp(task, nextDone) {
  const done = !!nextDone;
  const wasDone = !!task?.done;
  let completedAt = task?.completedAt ?? null;
  if (done && !wasDone) completedAt = new Date().toISOString();
  if (!done) completedAt = null;
  return { ...task, done, completedAt };
}
