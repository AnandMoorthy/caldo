import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { keyFor } from "./date.js";

export const JOURNAL_MOODS = [
  { id: "happy", label: "Happy" },
  { id: "calm", label: "Calm" },
  { id: "grateful", label: "Grateful" },
  { id: "tired", label: "Tired" },
  { id: "anxious", label: "Anxious" },
  { id: "frustrated", label: "Frustrated" },
];

export const MOMENT_MOODS = [
  { id: "happy", label: "Happy" },
  { id: "sad", label: "Sad" },
  { id: "tired", label: "Tired" },
  { id: "frustrated", label: "Frustrated" },
  { id: "excited", label: "Excited" },
  { id: "calm", label: "Calm" },
  { id: "anxious", label: "Anxious" },
  { id: "motivated", label: "Motivated" },
  { id: "thoughtful", label: "Thoughtful" },
  { id: "grateful", label: "Grateful" },
];

function isTaskItem(item) {
  return item && item.id !== "day_note" && item.id !== "__day_note__";
}

function toDate(value) {
  if (!value) return null;
  try {
    if (typeof value?.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    return new Date(value);
  } catch {
    return null;
  }
}

export function getPeriodRange(range = "week", today = new Date()) {
  if (range === "month") {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  return { start, end, days: eachDayOfInterval({ start, end }) };
}

export function getPeriodDays(range = "week", today = new Date()) {
  return getPeriodRange(range, today).days;
}

export function summarizeTasks(tasksMap = {}, dayKeys = []) {
  const byDay = dayKeys.map((key) => {
    const list = (tasksMap[key] || []).filter(isTaskItem);
    const total = list.length;
    const done = list.filter((task) => !!task.done).length;
    return { key, total, done };
  });
  const total = byDay.reduce((sum, day) => sum + day.total, 0);
  const done = byDay.reduce((sum, day) => sum + day.done, 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, percent, byDay };
}

export function summarizeHabits(habits = [], dayKeys = []) {
  const list = Array.isArray(habits) ? habits : [];
  const possible = list.length * dayKeys.length;
  let checkIns = 0;
  const byHabit = list.map((habit) => {
    let hits = 0;
    for (const key of dayKeys) {
      if (habit?.history?.[key]) hits += 1;
    }
    checkIns += hits;
    const rate = dayKeys.length > 0 ? Math.round((hits / dayKeys.length) * 100) : 0;
    return {
      id: habit.id,
      title: habit.title || "Untitled",
      hits,
      days: dayKeys.length,
      rate,
    };
  });
  const rate = possible > 0 ? Math.round((checkIns / possible) * 100) : 0;
  return { checkIns, possible, rate, byHabit, habitCount: list.length };
}

export function summarizeJournals(journals = [], dayKeys = []) {
  const keySet = new Set(dayKeys);
  const inRange = (Array.isArray(journals) ? journals : []).filter((entry) => keySet.has(entry?.dateKey));
  const moodCounts = {};
  let energySum = 0;
  let energyCount = 0;

  for (const entry of inRange) {
    if (entry?.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
    const energy = Number(entry?.energyLevel);
    if (Number.isFinite(energy) && energy > 0) {
      energySum += energy;
      energyCount += 1;
    }
  }

  return {
    daysWritten: inRange.length,
    avgEnergy: energyCount > 0 ? Math.round((energySum / energyCount) * 10) / 10 : null,
    moodCounts,
    entries: inRange,
  };
}

export function summarizeMoments(moments = [], start, end) {
  const list = Array.isArray(moments) ? moments : [];
  const rangeEnd = endOfDay(end);
  const inRange = list.filter((moment) => {
    const created = toDate(moment?.createdAt);
    if (!created) return false;
    try {
      return isWithinInterval(created, { start, end: rangeEnd });
    } catch {
      return false;
    }
  });

  const moodCounts = {};
  for (const moment of inRange) {
    if (moment?.mood) {
      moodCounts[moment.mood] = (moodCounts[moment.mood] || 0) + 1;
    }
  }

  return { count: inRange.length, moodCounts };
}

export function buildPeriodOverview({
  range = "week",
  today = new Date(),
  tasksMap = {},
  habits = [],
  journals = [],
  moments = [],
  streak = null,
} = {}) {
  const { start, end, days } = getPeriodRange(range, today);
  const dayKeys = days.map((day) => keyFor(day));
  const tasks = summarizeTasks(tasksMap, dayKeys);
  const habitSummary = summarizeHabits(habits, dayKeys);
  const journalSummary = summarizeJournals(journals, dayKeys);
  const momentSummary = summarizeMoments(moments, start, end);

  return {
    range,
    start,
    end,
    days,
    dayKeys,
    label:
      range === "month"
        ? format(today, "MMMM yyyy")
        : `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
    tasks,
    habits: habitSummary,
    journals: journalSummary,
    moments: momentSummary,
    streakCurrent: streak?.current || 0,
    streakLongest: streak?.longest || 0,
  };
}
