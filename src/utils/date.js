import { format } from "date-fns";

export function keyFor(date) {
  return format(date, "yyyy-MM-dd");
}

export function monthKeyFromDate(date) {
  return format(date, "yyyy-MM");
}

export function monthKeyFromDateKey(dateKey) {
  return dateKey.slice(0, 7);
}

/** Inclusive start / exclusive end dateKey bounds for a YYYY-MM month. */
export function dateKeyRangeForMonth(monthKey) {
  const startKey = `${monthKey}-01`;
  const [y, m] = String(monthKey).split("-").map(Number);
  const endKey =
    m === 12
      ? `${y + 1}-01-01`
      : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { startKey, endKey };
}

export function getMonthMapFor(tasksMap, monthKey) {
  const output = {};
  for (const key of Object.keys(tasksMap)) {
    if (key.startsWith(monthKey + "-")) output[key] = tasksMap[key];
  }
  return output;
}


