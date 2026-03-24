import type { Task } from '@shared/types';

/**
 * Generate projected recurring task instances for display in Week/Timeline.
 * These are virtual tasks — not stored in DB — just for visual display.
 *
 * Takes real tasks that have recurrence_rule set and generates future instances
 * within the given date range.
 */
export function expandRecurringTasks(tasks: Task[], startDate: string, endDate: string): Task[] {
  const projected: Task[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Find tasks with recurrence rules
  const recurringTasks = tasks.filter((t) => t.recurrence_rule && t.status !== 'archived');

  for (const task of recurringTasks) {
    const rule = task.recurrence_rule!;
    const dates = getOccurrences(rule, start, end);

    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];

      // Skip if a real task already exists for this date
      const alreadyExists = tasks.some(
        (t) =>
          t.recurrence_parent_id === task.id &&
          (t.scheduled_date === dateStr || t.due_date === dateStr)
      );
      // Also skip if this is the original task's own date
      if (task.due_date === dateStr || task.scheduled_date === dateStr) continue;
      if (alreadyExists) continue;

      projected.push({
        ...task,
        id: `projected-${task.id}-${dateStr}`,
        due_date: dateStr,
        scheduled_date: dateStr,
        scheduled_slot: task.scheduled_slot,
        status: 'todo',
        completed_at: null,
        // Mark as projected so views can style differently
        source_connector: 'recurrence',
      });
    }
  }

  return projected;
}

/**
 * Simple RRULE parser that generates dates within a range.
 * Handles FREQ=DAILY, FREQ=WEEKLY (with BYDAY, INTERVAL), FREQ=MONTHLY (with BYMONTHDAY).
 */
function getOccurrences(rule: string, start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const params = parseRRule(rule);

  const freq = params.FREQ;
  const interval = parseInt(params.INTERVAL || '1', 10);
  const byDay = params.BYDAY?.split(',') || [];
  const byMonthDay = params.BYMONTHDAY ? parseInt(params.BYMONTHDAY, 10) : null;

  const dayMap: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };

  if (freq === 'DAILY') {
    const cursor = new Date(start);
    while (cursor <= end) {
      // If BYDAY specified (weekdays), check day
      if (byDay.length > 0) {
        const jsDay = cursor.getDay();
        if (byDay.some((d) => dayMap[d] === jsDay)) {
          dates.push(new Date(cursor));
        }
      } else {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (freq === 'WEEKLY') {
    const targetDays = byDay.map((d) => dayMap[d]);
    if (targetDays.length === 0) targetDays.push(start.getDay()); // default to start day

    const cursor = new Date(start);
    let weekCount = 0;
    const weekStart = new Date(start);
    // Align to Monday
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    while (cursor <= end) {
      const currentWeekStart = new Date(cursor);
      currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7));
      const weeksSinceStart = Math.floor((currentWeekStart.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

      if (weeksSinceStart % interval === 0) {
        const jsDay = cursor.getDay();
        if (targetDays.includes(jsDay)) {
          dates.push(new Date(cursor));
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (freq === 'MONTHLY') {
    const targetDay = byMonthDay || 1;
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const actualDay = Math.min(targetDay, lastDayOfMonth);
      const date = new Date(year, month, actualDay);

      if (date >= start && date <= end) {
        dates.push(date);
      }

      cursor.setMonth(cursor.getMonth() + interval);
    }
  }

  return dates;
}

function parseRRule(rule: string): Record<string, string> {
  const params: Record<string, string> = {};
  // Strip "RRULE:" prefix if present
  const clean = rule.replace(/^RRULE:/, '');
  for (const part of clean.split(';')) {
    const [key, value] = part.split('=');
    if (key && value) params[key] = value;
  }
  return params;
}
