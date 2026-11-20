/**
 * Lightweight node test runner for sync merge (no test framework dependency).
 * Run: node src/utils/syncMerge.test.js
 */
import {
  mergeDayTasksFromCloud,
  mergeTasksMaps,
  mergeHabbits,
} from "./syncMerge.js";

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
  // Device A deleted task "x" from cloud. Device B still has it locally.
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

  // Habits: old union+reupload path would resurrect h-del; authoritative merge does not.
  const habitsLocal = [
    { id: "h-keep", title: "Keep", history: {} },
    { id: "h-del", title: "Deleted elsewhere", history: {} },
  ];
  const habitsCloud = [{ id: "h-keep", title: "Keep", history: {} }];
  const habitsMerged = mergeHabbits(habitsLocal, habitsCloud, { cloudAuthoritative: true });
  assert(sameIds(habitsMerged, ["h-keep"]), "habits refresh does not resurrect cloud deletes");
}

console.log(`syncMerge tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
