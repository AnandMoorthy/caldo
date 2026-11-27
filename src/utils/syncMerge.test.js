/**
 * Lightweight node test runner for sync merge (no test framework dependency).
 * Run: node src/utils/syncMerge.test.js
 */
import {
  mergeDayTasksFromCloud,
  mergeTasksMaps,
  mergeHabbits,
} from "./syncMerge.js";
import {
  dayHasCalendarMarkers,
  countMarkedDaysInMonth,
  tasksForMarkers,
} from "./calendarMarkers.js";

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

function sameIds(list, expected) {
  const ids = (list || []).map((t) => t.id).sort();
  const exp = [...expected].sort();
  return ids.length === exp.length && ids.every((id, i) => id === exp[i]);
}

// --- Deleted task on cloud must not resurrect from local ---
{
  const local = {
    "2026-03-10": [
      { id: "keep", title: "Keep me" },
      { id: "gone", title: "Deleted elsewhere" },
    ],
  };
  const cloud = {
    "2026-03-10": [{ id: "keep", title: "Keep me", done: true }],
  };
  const merged = mergeTasksMaps(local, cloud, {
    authoritativeMonthKeys: new Set(["2026-03"]),
  });
  assert(sameIds(merged["2026-03-10"], ["keep"]), "prunes local-only deleted task");
  assert(merged["2026-03-10"][0].done === true, "prefers cloud fields on conflict");
}

// --- Empty cloud day in authoritative month clears local tasks ---
{
  const local = {
    "2026-03-11": [{ id: "orphan", title: "Should go" }],
    "2026-02-01": [{ id: "other-month", title: "Stay until that month loads" }],
  };
  const cloud = {}; // fetch returned no tasks for March
  const merged = mergeTasksMaps(local, cloud, {
    authoritativeMonthKeys: new Set(["2026-03"]),
  });
  assert(!merged["2026-03-11"], "clears day when cloud has no tasks for that month");
  assert(sameIds(merged["2026-02-01"], ["other-month"]), "leaves non-authoritative months alone");
}

// --- Recurring instances and pending uploads survive prune ---
{
  const local = {
    "2026-03-12": [
      { id: "rec-1", title: "Recurring", isRecurringInstance: true },
      { id: "pending-1", title: "Offline create" },
      { id: "stale", title: "Stale" },
      { id: "day_note", dayNote: "note" },
    ],
  };
  const cloud = { "2026-03-12": [] };
  const merged = mergeTasksMaps(local, cloud, {
    authoritativeMonthKeys: ["2026-03"],
    pendingLocalIds: new Set(["pending-1"]),
  });
  assert(
    sameIds(merged["2026-03-12"], ["rec-1", "pending-1"]),
    "keeps recurring + pending; drops stale task and deleted day note"
  );
}

// --- Non-authoritative merge still unions (offline / legacy path) ---
{
  const local = [{ id: "a" }, { id: "b" }];
  const cloud = [{ id: "b", done: true }, { id: "c" }];
  const merged = mergeDayTasksFromCloud(local, cloud, { cloudAuthoritative: false });
  assert(sameIds(merged, ["a", "b", "c"]), "legacy union keeps local-only ids");
}

// --- Habits: cloud-authoritative drops deleted habits ---
{
  const local = [
    { id: "h1", title: "Keep", history: { "2026-03-01": true } },
    { id: "h2", title: "Deleted on other device", history: {} },
  ];
  const cloud = [{ id: "h1", title: "Keep", history: { "2026-03-02": true } }];
  const merged = mergeHabbits(local, cloud, { cloudAuthoritative: true });
  assert(sameIds(merged, ["h1"]), "habits prune deleted ids when cloud authoritative");
  assert(
    merged[0].history["2026-03-01"] && merged[0].history["2026-03-02"],
    "habit history still unions for shared ids"
  );
}

// --- Habits: non-authoritative still unions (should not be used after signed-in fetch) ---
{
  const merged = mergeHabbits(
    [{ id: "local-only", title: "Local" }],
    [{ id: "cloud-only", title: "Cloud" }],
    { cloudAuthoritative: false }
  );
  assert(sameIds(merged, ["local-only", "cloud-only"]), "habits union without authoritative flag");
}

// --- Multi-device delete scenario (user report) ---
{
  const deviceBLocal = {
    "2026-03-15": [
      { id: "x", title: "Deleted on phone" },
      { id: "y", title: "Still valid" },
    ],
  };
  const cloudAfterDelete = {
    "2026-03-15": [{ id: "y", title: "Still valid" }],
  };
  const deviceBAfterRefresh = mergeTasksMaps(deviceBLocal, cloudAfterDelete, {
    authoritativeMonthKeys: new Set(["2026-03"]),
  });
  assert(
    sameIds(deviceBAfterRefresh["2026-03-15"], ["y"]),
    "device B refresh drops task deleted on device A"
  );

  const habitsLocal = [
    { id: "h-keep", title: "Keep", history: {} },
    { id: "h-del", title: "Deleted elsewhere", history: {} },
  ];
  const habitsCloud = [{ id: "h-keep", title: "Keep", history: {} }];
  const habitsMerged = mergeHabbits(habitsLocal, habitsCloud, { cloudAuthoritative: true });
  assert(sameIds(habitsMerged, ["h-keep"]), "habits refresh does not resurrect cloud deletes");
}

// =============================================================================
// Regression: single-day refresh must NOT wipe sibling month calendar dots
// =============================================================================
{
  const monthMap = {
    "2026-11-01": [{ id: "t1", title: "Early month task", due: "2026-11-01" }],
    "2026-11-10": [
      { id: "t2", title: "Mid task", due: "2026-11-10" },
      { id: "day_note", due: "2026-11-10", dayNote: "Note here" },
    ],
    "2026-11-27": [{ id: "t3", title: "Today task", due: "2026-11-27" }],
  };

  // BUG reproduction: treating a single-day cloud payload as month-authoritative
  const buggy = mergeTasksMaps(monthMap, {
    "2026-11-27": [{ id: "t3", title: "Today task", due: "2026-11-27", done: false }],
  }, {
    authoritativeMonthKeys: new Set(["2026-11"]),
  });
  assert(!buggy["2026-11-01"], "BUG repro: month-authoritative day refresh wipes Nov 1");
  assert(!buggy["2026-11-10"], "BUG repro: month-authoritative day refresh wipes Nov 10 note/tasks");
  assert(sameIds(buggy["2026-11-27"], ["t3"]), "BUG repro: clicked day remains");

  // Fix: day-authoritative refresh only reconciles that date
  const fixed = mergeTasksMaps(monthMap, {
    "2026-11-27": [{ id: "t3", title: "Today task", due: "2026-11-27", done: true }],
  }, {
    authoritativeDateKeys: new Set(["2026-11-27"]),
  });
  assert(sameIds(fixed["2026-11-01"], ["t1"]), "day refresh keeps Nov 1 tasks");
  assert(
    sameIds(fixed["2026-11-10"], ["t2", "day_note"]),
    "day refresh keeps Nov 10 tasks + note"
  );
  assert(fixed["2026-11-27"][0].done === true, "day refresh updates clicked day from cloud");
  assert(
    countMarkedDaysInMonth(Object.keys(fixed), fixed, new Map(), "2026-11") === 3,
    "all three marked days stay visible after day refresh"
  );
}

// --- Day-authoritative empty cloud clears only that day ---
{
  const local = {
    "2026-11-05": [{ id: "keep-other", title: "Other day" }],
    "2026-11-06": [{ id: "gone-here", title: "Deleted on this day" }],
  };
  const merged = mergeTasksMaps(local, { "2026-11-06": [] }, {
    authoritativeDateKeys: new Set(["2026-11-06"]),
  });
  assert(sameIds(merged["2026-11-05"], ["keep-other"]), "sibling day untouched");
  assert(!merged["2026-11-06"], "authoritative empty day clears only that date");
}

// --- Calendar marker helpers ---
{
  assert(tasksForMarkers([{ id: "a", title: "T" }, { id: "day_note", dayNote: "n" }]).length === 1, "tasksForMarkers skips day_note");
  assert(dayHasCalendarMarkers([{ id: "a", title: "T" }], null) === true, "task-only day has markers");
  assert(dayHasCalendarMarkers([], { content: "hello" }) === true, "note-cache-only day has markers");
  assert(dayHasCalendarMarkers([{ id: "day_note", dayNote: "  " }], null) === false, "blank note is not a marker");
  assert(dayHasCalendarMarkers([], null) === false, "empty day has no markers");
}

// --- Full month load then day click then navigate-back simulation ---
{
  // 1) Month load populates several past days
  let state = {};
  const cloudMonth = {
    "2026-11-02": [{ id: "a", title: "Mon" }],
    "2026-11-03": [{ id: "b", title: "Tue" }, { id: "day_note", dayNote: "Tue note" }],
    "2026-11-27": [{ id: "c", title: "Fri" }],
  };
  state = mergeTasksMaps(state, cloudMonth, {
    authoritativeMonthKeys: new Set(["2026-11"]),
  });
  assert(
    countMarkedDaysInMonth(Object.keys(state), state, new Map(), "2026-11") === 3,
    "month load shows markers on all task/note days"
  );

  // 2) Click today — must not erase previous dates
  state = mergeTasksMaps(state, {
    "2026-11-27": [{ id: "c", title: "Fri", done: true }],
  }, {
    authoritativeDateKeys: new Set(["2026-11-27"]),
  });
  assert(
    countMarkedDaysInMonth(Object.keys(state), state, new Map(), "2026-11") === 3,
    "after click, previous-date markers remain"
  );

  // 3) Simulate navigating away (no wipe) then force month refresh restores/keeps dots
  state = mergeTasksMaps(state, cloudMonth, {
    authoritativeMonthKeys: new Set(["2026-11"]),
  });
  assert(
    countMarkedDaysInMonth(Object.keys(state), state, new Map(), "2026-11") === 3,
    "returning to month keeps/restores all markers"
  );
}

console.log(`syncMerge tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
