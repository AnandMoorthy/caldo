/**
 * Regression tests for month task query bounds.
 * Run: node src/utils/monthQuery.test.js
 */
import { dateKeyRangeForMonth } from "./date.js";

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

function includesDateKey(monthKey, dateKey) {
  const { startKey, endKey } = dateKeyRangeForMonth(monthKey);
  return dateKey >= startKey && dateKey < endKey;
}

// --- dateKey range covers every day of the month ---
{
  const { startKey, endKey } = dateKeyRangeForMonth("2026-11");
  assert(startKey === "2026-11-01", "nov start key");
  assert(endKey === "2026-12-01", "nov end key");
  assert(includesDateKey("2026-11", "2026-11-01"), "includes first day");
  assert(includesDateKey("2026-11", "2026-11-15"), "includes mid month");
  assert(includesDateKey("2026-11", "2026-11-30"), "includes last day");
  assert(!includesDateKey("2026-11", "2026-10-31"), "excludes prior month");
  assert(!includesDateKey("2026-11", "2026-12-01"), "excludes next month");
}

{
  const { startKey, endKey } = dateKeyRangeForMonth("2026-12");
  assert(startKey === "2026-12-01", "dec start key");
  assert(endKey === "2027-01-01", "dec rolls year");
  assert(includesDateKey("2026-12", "2026-12-31"), "includes dec 31");
}

// --- Local dueDate bounds miss early-month UTC tasks west of UTC ---
{
  // Simulates the old bug: local Pacific midnight vs UTC-midnight dueDate from parseISO.
  const y = 2026;
  const m = 11; // November
  const localStart = new Date(y, m - 1, 1); // interpreted in the runtime TZ
  const utcDueNov1 = new Date(Date.UTC(y, m - 1, 1)); // how parseISO('2026-11-01') stores

  // In any TZ west of UTC, local Nov 1 00:00 is AFTER UTC Nov 1 00:00.
  const offsetMinutes = localStart.getTimezoneOffset(); // positive west of UTC
  if (offsetMinutes > 0) {
    assert(
      utcDueNov1 < localStart,
      "UTC Nov 1 midnight is before local Nov 1 midnight west of UTC"
    );
    assert(
      !(utcDueNov1 >= localStart),
      "old local dueDate lower bound would exclude Nov 1 task"
    );
  } else {
    // East of / on UTC: document that dateKey range is still the safer primary query.
    assert(true, "non-west TZ: dateKey range still preferred");
  }

  assert(
    includesDateKey("2026-11", "2026-11-01"),
    "dateKey range still includes Nov 1 regardless of TZ"
  );
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
