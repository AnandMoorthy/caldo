import { addDays, addMonths, differenceInCalendarDays, differenceInCalendarMonths, endOfMonth, getDate, getDay, isAfter, isBefore, isWithinInterval, parseISO, startOfDay, startOfMonth, format } from 'date-fns';

// Series shape reference (for docs only):
// {
//   id: string,
//   title: string,
//   notes: string,
//   priority: 'low'|'medium'|'high',
//   subtasks: Array<{ id: string, title: string, done: boolean, createdAt: string }>,
//   startDateKey: 'YYYY-MM-DD',
//   recurrence: {
//     frequency: 'daily'|'weekly'|'monthly',
//     interval: number,
//     byWeekday?: number[], // 0-6 (Sun-Sat)
//     byMonthday?: number[], // 1-31
//     ends?: { type: 'never'|'onDate'|'afterCount', onDateKey?: string, count?: number }
//   },
//   exceptions?: string[], // dateKeys
//   overrides?: Record<string, Partial<{ title: string, notes: string, priority: string, done: boolean, subtasks: any[] }>>
// }

function toDate(dateKey) {
  return startOfDay(parseISO(dateKey));
}

function withinEnds(dateKey, series) {
  const ends = series?.recurrence?.ends;
  if (!ends || ends.type === 'never') return true;
  if (ends.type === 'onDate') {
    if (!ends.onDateKey) return true;
    return !isAfter(toDate(dateKey), toDate(ends.onDateKey));
  }
  return true; // 'afterCount' handled in generators via counting
}

function isException(dateKey, series) {
  return Array.isArray(series?.exceptions) && series.exceptions.includes(dateKey);
}

export function generateOccurrences(series, rangeStart, rangeEnd) {
  const out = [];
  if (!series || !series.recurrence || !series.recurrence.frequency) return out;
  const start = toDate(series.startDateKey);
  const windowStart = startOfDay(rangeStart);
  const windowEnd = startOfDay(rangeEnd);
  const freq = series.recurrence.frequency;
  const interval = Math.max(1, Number(series.recurrence.interval) || 1);
  const ends = series?.recurrence?.ends;
  const countCap = ends?.type === 'afterCount' ? Math.max(0, Number(ends.count) || 0) : Infinity;

  if (freq === 'daily') {
    // Compute first candidate >= max(start, windowStart) respecting interval
    let first = windowStart;
    if (isBefore(first, start)) first = start;
    // Align to interval from start
    const diffFromStart = differenceInCalendarDays(first, start);
    const remainder = ((diffFromStart % interval) + interval) % interval;
    if (remainder !== 0) first = addDays(first, interval - remainder);
    let current = first;
    let produced = 0;
    while (!isAfter(current, windowEnd) && produced < countCap) {
      const dk = format(current, 'yyyy-MM-dd');
      if (!isException(dk, series) && withinEnds(dk, series)) {
        out.push(dk);
        produced++;
      }
      current = addDays(current, interval);
    }
    return out;
  }

  if (freq === 'weekly') {
    const weekdays = Array.isArray(series.recurrence.byWeekday) && series.recurrence.byWeekday.length
      ? new Set(series.recurrence.byWeekday.map(Number))
      : new Set([getDay(start)]);
    // We step day-by-day but only in weeks aligned by interval from start
    // Determine the first week index covering windowStart
    const firstDay = isBefore(windowStart, start) ? start : windowStart;
    let produced = 0;
    let cursor = firstDay;
    while (!isAfter(cursor, windowEnd) && produced < countCap) {
      // week distance from start
      const daysFromStart = differenceInCalendarDays(cursor, start);
      const weeksFromStart = Math.floor(daysFromStart / 7);
      const inAlignedWeek = weeksFromStart % interval === 0 && daysFromStart >= 0;
      if (inAlignedWeek && weekdays.has(getDay(cursor))) {
        const dk = format(cursor, 'yyyy-MM-dd');
        if (!isException(dk, series) && withinEnds(dk, series)) {
          out.push(dk);
          produced++;
        }
      }
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  if (freq === 'monthly') {
    const monthdays = Array.isArray(series.recurrence.byMonthday) && series.recurrence.byMonthday.length
      ? [...new Set(series.recurrence.byMonthday.map(Number).filter((d) => d >= 1 && d <= 31))]
      : [getDate(start)];
    // Iterate months aligned by interval
    const firstMonthStart = startOfMonth(isBefore(windowStart, start) ? start : windowStart);
    let produced = 0;
    // Align month diff
    let diffMonths = differenceInCalendarMonths(firstMonthStart, start);
    if (diffMonths < 0) diffMonths = 0;
    const remainder = ((diffMonths % interval) + interval) % interval;
    let baseMonth = remainder === 0 ? firstMonthStart : addMonths(firstMonthStart, interval - remainder);
    while (!isAfter(baseMonth, windowEnd) && produced < countCap) {
      for (const md of monthdays) {
        const lastDay = getDate(endOfMonth(baseMonth));
        if (md > lastDay) continue; // skip invalid dates
        const candidate = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), md);
        if (!isWithinInterval(candidate, { start: windowStart, end: windowEnd })) continue;
        if (isBefore(candidate, start)) continue;
        const dk = format(candidate, 'yyyy-MM-dd');
        if (!withinEnds(dk, series)) continue;
        if (isException(dk, series)) continue;
        out.push(dk);
        produced++;
        if (produced >= countCap) break;
      }
      baseMonth = addMonths(baseMonth, interval);
    }
    return out.sort();
  }

  return out;
}

export function makeInstanceFromSeries(series, dateKey) {
  const base = {
    id: `${series.id}:${dateKey}`,
    title: series.title || 'Untitled',
    notes: series.notes || '',
    done: false,
    priority: series.priority || 'medium',
    due: dateKey,
    createdAt: new Date(`${dateKey}T00:00:00`).toISOString(),
    isRecurringInstance: true,
    seriesId: series.id,
    occurrenceDateKey: dateKey,
  };
  if (Array.isArray(series.subtasks) && series.subtasks.length) base.subtasks = series.subtasks;
  return base;
}

export function applyOverrides(instanceTask, series) {
  const ov = series?.overrides?.[instanceTask.due];
  if (!ov) return instanceTask;
  return {
    ...instanceTask,
    ...ov,
  };
}

export function materializeSeries(seriesList, rangeStart, rangeEnd) {
  const byDate = {};
  const validSeries = Array.isArray(seriesList) ? seriesList : [];
  for (const s of validSeries) {
    const occs = generateOccurrences(s, rangeStart, rangeEnd);
    for (const dk of occs) {
      const inst = applyOverrides(makeInstanceFromSeries(s, dk), s);
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push(inst);
    }
  }
  return byDate;
}

export function formatRecurrenceInfo(series) {
  if (!series || !series.recurrence || !series.recurrence.frequency) return null;
  
  const { frequency, interval, byWeekday, byMonthday, ends } = series.recurrence;
  
  let info = '';
  
  // Frequency and interval
  if (interval === 1) {
    info += frequency === 'daily' ? 'Daily' : 
            frequency === 'weekly' ? 'Weekly' : 
            frequency === 'monthly' ? 'Monthly' : '';
  } else {
    info += `Every ${interval} ${frequency === 'daily' ? 'days' : 
                                    frequency === 'weekly' ? 'weeks' : 
                                    frequency === 'monthly' ? 'months' : ''}`;
  }
  
  // Specific days for weekly
  if (frequency === 'weekly' && Array.isArray(byWeekday) && byWeekday.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = byWeekday.map(d => dayNames[d]).join(', ');
    info += ` on ${days}`;
  }
  
  // Specific dates for monthly
  if (frequency === 'monthly' && Array.isArray(byMonthday) && byMonthday.length > 0) {
    const dates = byMonthday.map(d => d).join(', ');
    info += ` on ${dates}`;
  }
  
  // End conditions
  if (ends && ends.type !== 'never') {
    if (ends.type === 'onDate' && ends.onDateKey) {
      const date = new Date(ends.onDateKey);
      info += ` until ${date.toLocaleDateString()}`;
    } else if (ends.type === 'afterCount' && ends.count) {
      info += ` for ${ends.count} times`;
    }
  }
  
  return info;
}

export function getRecurrenceIcon(series) {
  if (!series || !series.recurrence || !series.recurrence.frequency) return null;
  
  // Return null to use the default RefreshCcw icon
  return null;
}


