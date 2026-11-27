/**
 * Month-grid marker helpers (task/note dots).
 * Pure functions so calendar visibility can be regression-tested without React.
 */

export function isTaskLikeItem(item) {
  if (!item || item.id === "day_note") return false;
  if (item.dayNote != null && item.title == null && item.done == null) return false;
  return true;
}

export function isNoteLikeItem(item) {
  return !!(item && (item.id === "day_note" || (item.dayNote != null && !item.title)));
}

/** Tasks that should contribute to calendar dots for a day list. */
export function tasksForMarkers(dayList = []) {
  return (Array.isArray(dayList) ? dayList : []).filter(isTaskLikeItem);
}

/** Whether a day should show the blue note marker. */
export function dayHasNoteMarker(dayList = [], notesCacheEntry = null) {
  const list = Array.isArray(dayList) ? dayList : [];
  const hasLegacy = list.some(
    (t) => isNoteLikeItem(t) && String(t.dayNote || "").trim().length > 0
  );
  const hasCached =
    !!notesCacheEntry && String(notesCacheEntry.content || "").trim().length > 0;
  return hasLegacy || hasCached;
}

/** Whether a day cell should render any bottom markers. */
export function dayHasCalendarMarkers(dayList = [], notesCacheEntry = null) {
  return tasksForMarkers(dayList).length > 0 || dayHasNoteMarker(dayList, notesCacheEntry);
}

/**
 * Count in-month days that should show markers.
 * @param {string[]} dateKeys
 * @param {Record<string, any[]>} tasksMap
 * @param {Map|Record<string, any>} notesCache
 * @param {string} monthKey YYYY-MM
 */
export function countMarkedDaysInMonth(dateKeys, tasksMap, notesCache, monthKey) {
  let count = 0;
  for (const dk of dateKeys || []) {
    if (!String(dk).startsWith(`${monthKey}-`)) continue;
    const note =
      notesCache instanceof Map ? notesCache.get(dk) : notesCache?.[dk] || null;
    if (dayHasCalendarMarkers(tasksMap?.[dk] || [], note)) count += 1;
  }
  return count;
}
