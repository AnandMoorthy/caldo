/**
 * Cloud/local merge helpers.
 *
 * Union-by-id merges cannot represent deletions: a task deleted on device A
 * (and removed from Firestore) would still exist in device B's localStorage,
 * survive every refresh, and eventually get written back to the cloud.
 *
 * For months we successfully fetched, cloud is authoritative for membership.
 * Local-only rows are kept only when:
 * - they are materialized recurring instances (not always stored in Firestore), or
 * - their id is in `pendingLocalIds` (create/update that has not reached the cloud yet).
 */

const DAY_NOTE_ID = "day_note";

function monthKeyFromDateKey(dateKey) {
  return String(dateKey || "").slice(0, 7);
}

function isKeepLocalOnlyTask(task, pendingLocalIds) {
  if (!task || !task.id) return false;
  if (task.id === DAY_NOTE_ID) return false;
  if (task.isRecurringInstance) return true;
  if (pendingLocalIds && pendingLocalIds.has(task.id)) return true;
  return false;
}

/**
 * Merge one day's task lists. When `cloudAuthoritative` is true, drop local-only
 * tasks that are neither recurring instances nor pending uploads.
 */
export function mergeDayTasksFromCloud(localList, cloudList, { cloudAuthoritative = false, pendingLocalIds = null } = {}) {
  const local = Array.isArray(localList) ? localList : [];
  const cloud = Array.isArray(cloudList) ? cloudList : [];

  if (!cloudAuthoritative) {
    const byId = new Map();
    for (const t of local) {
      if (t?.id != null) byId.set(t.id, t);
    }
    for (const t of cloud) {
      if (t?.id == null) continue;
      const existing = byId.get(t.id);
      byId.set(t.id, existing ? { ...existing, ...t } : t);
    }
    return Array.from(byId.values());
  }

  const localById = new Map();
  for (const t of local) {
    if (t?.id != null) localById.set(t.id, t);
  }

  const merged = [];
  const seen = new Set();

  for (const t of cloud) {
    if (t?.id == null) continue;
    const existing = localById.get(t.id);
    merged.push(existing ? { ...existing, ...t } : t);
    seen.add(t.id);
  }

  for (const t of local) {
    if (t?.id == null || seen.has(t.id)) continue;
    if (isKeepLocalOnlyTask(t, pendingLocalIds)) {
      merged.push(t);
      seen.add(t.id);
    }
  }

  return merged;
}

/**
 * Merge task maps after a cloud fetch.
 *
 * @param {Record<string, any[]>} localMap
 * @param {Record<string, any[]>} cloudMap - days returned by the fetch (may omit empty days)
 * @param {{ authoritativeMonthKeys?: Iterable<string>|Set<string>|null, pendingLocalIds?: Set<string>|null }} [options]
 */
export function mergeTasksMaps(localMap, cloudMap, { authoritativeMonthKeys = null, pendingLocalIds = null } = {}) {
  const authMonths = authoritativeMonthKeys
    ? authoritativeMonthKeys instanceof Set
      ? authoritativeMonthKeys
      : new Set(authoritativeMonthKeys)
    : null;

  const result = { ...(localMap || {}) };
  const cloud = cloudMap || {};

  const touchedDates = new Set(Object.keys(cloud));
  if (authMonths && authMonths.size) {
    for (const dateKey of Object.keys(result)) {
      if (authMonths.has(monthKeyFromDateKey(dateKey))) touchedDates.add(dateKey);
    }
  }

  for (const dateKey of touchedDates) {
    const cloudAuthoritative = !!(authMonths && authMonths.has(monthKeyFromDateKey(dateKey)));
    const mergedList = mergeDayTasksFromCloud(result[dateKey] || [], cloud[dateKey] || [], {
      cloudAuthoritative,
      pendingLocalIds,
    });
    if (mergedList.length) result[dateKey] = mergedList;
    else delete result[dateKey];
  }

  return result;
}

/**
 * Merge habits. When `cloudAuthoritative` is true (signed-in cloud fetch),
 * cloud membership wins so deletes propagate; history maps are still unioned
 * for habits that exist on both sides.
 */
export function mergeHabbits(localItems, cloudItems, { cloudAuthoritative = false } = {}) {
  const localList = Array.isArray(localItems) ? localItems : [];
  const cloudList = Array.isArray(cloudItems) ? cloudItems : [];

  if (cloudAuthoritative) {
    const localById = new Map();
    for (const item of localList) {
      if (!item?.id) continue;
      localById.set(item.id, item);
    }
    return cloudList
      .filter((item) => item?.id)
      .map((item) => {
        const existing = localById.get(item.id);
        if (!existing) return item;
        return {
          ...existing,
          ...item,
          history: {
            ...(existing?.history && typeof existing.history === "object" ? existing.history : {}),
            ...(item?.history && typeof item.history === "object" ? item.history : {}),
          },
        };
      });
  }

  const byId = new Map();
  for (const item of localList) {
    if (!item?.id) continue;
    byId.set(item.id, item);
  }
  for (const item of cloudList) {
    if (!item?.id) continue;
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    byId.set(item.id, {
      ...existing,
      ...item,
      history: {
        ...(existing?.history && typeof existing.history === "object" ? existing.history : {}),
        ...(item?.history && typeof item.history === "object" ? item.history : {}),
      },
    });
  }
  return Array.from(byId.values());
}
