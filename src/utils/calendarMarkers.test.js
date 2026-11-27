/**
 * Run: node src/utils/calendarMarkers.test.js
 */
import {
  dayHasCalendarMarkers,
  dayHasNoteMarker,
  tasksForMarkers,
  countMarkedDaysInMonth,
} from "./calendarMarkers.js";
import { mergeTasksMaps } from "./syncMerge.js";

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

{
  const list = [
    { id: "t1", title: "Task", done: false },
    { id: "day_note", dayNote: "Hello" },
  ];
  assert(tasksForMarkers(list).length === 1, "one task marker contributor");
  assert(dayHasNoteMarker(list, null) === true, "legacy day note counts");
  assert(dayHasCalendarMarkers(list, null) === true, "day with task+note has markers");
}

{
  assert(dayHasNoteMarker([], { content: "Cached" }) === true, "notesCache content counts");
  assert(dayHasNoteMarker([], { content: "   " }) === false, "whitespace-only cache ignored");
}

{
  const tasksMap = {
    "2026-11-01": [{ id: "t1", title: "Past" }],
    "2026-11-15": [],
    "2026-11-20": [{ id: "day_note", dayNote: "Only note" }],
    "2026-10-31": [{ id: "other", title: "Other month" }],
  };
  const notes = new Map([["2026-11-05", { content: "From cache" }]]);
  // 01 has task, 05 has cache note only (no tasksMap entry), 20 has legacy note
  const keys = ["2026-11-01", "2026-11-05", "2026-11-15", "2026-11-20", "2026-10-31"];
  assert(
    countMarkedDaysInMonth(keys, tasksMap, notes, "2026-11") === 3,
    "counts task day, cache-note day, and legacy-note day; ignores empty + other month"
  );
}

// End-to-end marker persistence across the buggy vs fixed merge modes
{
  const loaded = {
    "2026-11-04": [{ id: "early", title: "Earlier this month" }],
    "2026-11-12": [{ id: "day_note", dayNote: "Mid note" }],
    "2026-11-27": [{ id: "today", title: "Today" }],
  };

  const afterBadClick = mergeTasksMaps(loaded, {
    "2026-11-27": [{ id: "today", title: "Today" }],
  }, { authoritativeMonthKeys: new Set(["2026-11"]) });

  assert(
    countMarkedDaysInMonth(Object.keys(afterBadClick), afterBadClick, new Map(), "2026-11") === 1,
    "bad month-authoritative click leaves only clicked day marked"
  );

  const afterGoodClick = mergeTasksMaps(loaded, {
    "2026-11-27": [{ id: "today", title: "Today", done: true }],
  }, { authoritativeDateKeys: new Set(["2026-11-27"]) });

  assert(
    countMarkedDaysInMonth(Object.keys(afterGoodClick), afterGoodClick, new Map(), "2026-11") === 3,
    "good day-authoritative click keeps all month markers"
  );
  assert(
    dayHasCalendarMarkers(afterGoodClick["2026-11-04"], null),
    "previous date dots remain visible"
  );
  assert(
    dayHasCalendarMarkers(afterGoodClick["2026-11-12"], null),
    "previous date note dots remain visible"
  );
}

console.log(`calendarMarkers tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
