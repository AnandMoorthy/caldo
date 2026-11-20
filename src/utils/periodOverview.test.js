/**
 * Lightweight node test runner for period overview aggregators.
 * Run: node src/utils/periodOverview.test.js
 */
import {
  buildPeriodOverview,
  summarizeHabits,
  summarizeTasks,
} from "./periodOverview.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  console.error("FAIL:", message);
}

const today = new Date("2026-11-21T10:00:00");
const tasksMap = {
  "2026-11-16": [
    { id: "1", done: true },
    { id: "2", done: false },
  ],
  "2026-11-17": [
    { id: "3", done: true },
    { id: "day_note", dayNote: "x" },
  ],
};
const habits = [
  { id: "h1", title: "Walk", history: { "2026-11-16": true, "2026-11-17": true } },
];
const journals = [{ dateKey: "2026-11-16", mood: "calm", energyLevel: 4 }];
const moments = [{ id: "m1", mood: "happy", createdAt: "2026-11-16T12:00:00.000Z" }];

{
  const week = buildPeriodOverview({
    range: "week",
    today,
    tasksMap,
    habits,
    journals,
    moments,
    streak: { current: 2, longest: 5 },
  });
  assert(week.dayKeys.length === 7, "week should have 7 days");
  assert(week.dayKeys[0] === "2026-11-16", "week should start Monday 2026-11-16");
  assert(week.tasks.total === 3, "week tasks skip day_note");
  assert(week.tasks.done === 2, "week done count");
  assert(week.habits.checkIns === 2, "habit check-ins in week");
  assert(week.journals.daysWritten === 1, "journal days");
  assert(week.journals.avgEnergy === 4, "avg energy");
  assert(week.moments.count === 1, "moments in week");
  assert(week.streakCurrent === 2, "streak current");
}

{
  const month = buildPeriodOverview({
    range: "month",
    today,
    tasksMap,
    habits,
    journals,
    moments,
  });
  assert(month.dayKeys.length === 30, "November 2026 has 30 days");
  assert(month.tasks.total === 3, "month task totals");
}

{
  const summary = summarizeTasks(
    { "2026-11-16": [{ id: "a", done: false }, { id: "__day_note__", dayNote: true }] },
    ["2026-11-16"]
  );
  assert(summary.total === 1, "DAY_NOTE_ID skipped");
}

{
  const summary = summarizeHabits(
    [{ id: "h", history: { "2026-11-16": true } }],
    ["2026-11-16", "2026-11-17"]
  );
  assert(summary.rate === 50, "habit rate 1/2 = 50%");
}

console.log(`periodOverview tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
