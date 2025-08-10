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

export function getMonthMapFor(tasksMap, monthKey) {
  const output = {};
  for (const key of Object.keys(tasksMap)) {
    if (key.startsWith(monthKey + "-")) output[key] = tasksMap[key];
  }
  return output;
}


