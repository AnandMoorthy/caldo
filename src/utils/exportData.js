const EXPORT_VERSION = 1;
const PAGE_SIZE = 200;

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/** Convert Firestore Timestamps / Dates (and nested structures) into JSON-safe values. */
export function serializeForExport(value) {
  if (value == null) return value;

  if (typeof value?.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForExport(item));
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "editToken") continue; // never export public-write secrets
      out[key] = serializeForExport(nested);
    }
    return out;
  }

  return value;
}

export function buildCaldoExport(payload) {
  return serializeForExport({
    app: "caldo",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: payload.tasks || [],
    dayNotes: payload.dayNotes || [],
    notes: payload.notes || [],
    journals: payload.journals || [],
    moments: payload.moments || [],
    momentCategories: payload.momentCategories || [],
    habits: payload.habits || [],
    recurringSeries: payload.recurringSeries || [],
  });
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportFilename() {
  const stamp = new Date().toISOString().slice(0, 10);
  return `caldo-export-${stamp}.json`;
}

function tasksAndDayNotesFromLocalMap(tasksMap = {}) {
  const tasks = [];
  const dayNotes = [];

  for (const [dateKey, dayList] of Object.entries(tasksMap || {})) {
    if (!Array.isArray(dayList)) continue;
    for (const item of dayList) {
      if (!item || typeof item !== "object") continue;
      if (item.id === "day_note" || item.id === "__day_note__") {
        const content = String(item.dayNote || "").trim();
        if (!content) continue;
        dayNotes.push({
          id: dateKey,
          dateKey,
          content: item.dayNote,
          updatedAt: item.createdAt || null,
          pinned: !!item.pinned,
        });
      } else {
        tasks.push({ ...item, dateKey: item.dateKey || dateKey });
      }
    }
  }

  return { tasks, dayNotes };
}

async function gatherFromCloud(repos) {
  const {
    taskRepo,
    noteRepo,
    snippetRepo,
    journalRepo,
    momentRepo,
    habitRepo,
  } = repos || {};

  const [
    tasks,
    dayNotes,
    notes,
    journals,
    moments,
    momentCategories,
    habits,
    recurringSeries,
  ] = await Promise.all([
    taskRepo?.listAllTasks?.({ pageSize: PAGE_SIZE }) ?? Promise.resolve([]),
    noteRepo?.listAllDayNotes?.({ pageSize: PAGE_SIZE }) ?? Promise.resolve([]),
    snippetRepo?.listAllSnippets?.({ pageSize: PAGE_SIZE }) ?? Promise.resolve([]),
    journalRepo?.listAllJournals?.({ pageSize: PAGE_SIZE }) ?? Promise.resolve([]),
    momentRepo?.listAllMoments?.({ pageSize: PAGE_SIZE }) ?? Promise.resolve([]),
    momentRepo?.getCategories?.() ?? Promise.resolve([]),
    habitRepo?.loadHabbits?.() ?? Promise.resolve([]),
    taskRepo?.loadRecurringSeries?.() ?? Promise.resolve([]),
  ]);

  return {
    tasks,
    dayNotes,
    notes,
    journals,
    moments,
    momentCategories,
    habits,
    recurringSeries,
  };
}

function gatherFromLocal(local = {}) {
  const { tasks, dayNotes } = tasksAndDayNotesFromLocalMap(local.tasksMap);
  return {
    tasks,
    dayNotes,
    notes: Array.isArray(local.snippets) ? local.snippets : [],
    journals: Array.isArray(local.journals) ? local.journals : [],
    moments: Array.isArray(local.moments) ? local.moments : [],
    momentCategories: Array.isArray(local.momentCategories) ? local.momentCategories : [],
    habits: Array.isArray(local.habits) ? local.habits : [],
    recurringSeries: Array.isArray(local.recurringSeries) ? local.recurringSeries : [],
  };
}

/**
 * Build and download a full CalDo JSON export.
 * Signed-in: page through Firestore. Signed-out: use local caches / localStorage state.
 */
export async function exportAllCaldoData({ signedIn = false, repos = null, local = {} } = {}) {
  if (signedIn) {
    const required = ["taskRepo", "noteRepo", "snippetRepo", "journalRepo", "momentRepo", "habitRepo"];
    const missing = required.filter((key) => !repos?.[key]);
    if (missing.length) {
      throw new Error("Cloud sync is still starting. Try again in a moment.");
    }
  }
  const payload = signedIn ? await gatherFromCloud(repos) : gatherFromLocal(local);
  const data = buildCaldoExport(payload);
  downloadJson(exportFilename(), data);
  return data;
}
