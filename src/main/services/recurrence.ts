import { RRule } from 'rrule';
import { getDb } from '../database/index';
import { createTask } from '../database/tasks';
import type { NewTask } from '../../shared/types';
import * as cron from 'node-cron';

let cronJob: ReturnType<typeof cron.schedule> | null = null;

export function startRecurrenceService(): void {
  // Run on startup
  processRecurrences();

  // Then every hour
  cronJob = cron.schedule('0 * * * *', () => {
    processRecurrences();
  });

  console.log('Recurrence service started');
}

export function stopRecurrenceService(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}

/**
 * Process all active recurring tasks and templates.
 * For each recurrence rule, check if the next occurrence is due
 * and no instance exists for it yet — if so, create one.
 */
export function processRecurrences(): number {
  const db = getDb();
  let createdCount = 0;

  // 1. Process recurring tasks (tasks with recurrence_rule set)
  const recurringTasks = db.prepare(`
    SELECT * FROM tasks
    WHERE recurrence_rule IS NOT NULL
    AND status = 'done'
    AND recurrence_rule != ''
  `).all() as Record<string, unknown>[];

  for (const parent of recurringTasks) {
    const ruleStr = parent.recurrence_rule as string;
    const parentId = parent.id as string;

    try {
      const rule = RRule.fromString(ruleStr);
      const now = new Date();

      // Get next occurrence after the parent's completion date
      const completedAt = parent.completed_at
        ? new Date(parent.completed_at as string)
        : now;
      const nextDates = rule.between(completedAt, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), true);

      if (nextDates.length === 0) continue;
      const nextDate = nextDates[0];

      // Check if an instance already exists for this date
      const dateStr = nextDate.toISOString().split('T')[0];
      const existing = db.prepare(`
        SELECT id FROM tasks
        WHERE recurrence_parent_id = ?
        AND scheduled_date = ?
      `).get(parentId, dateStr);

      if (existing) continue;

      // Create the new instance
      const newTask: NewTask = {
        title: parent.title as string,
        description: parent.description as string | null,
        priority: parent.priority as 0 | 1 | 2 | 3,
        category: parent.category as string | null,
        tags: parent.tags ? JSON.parse(parent.tags as string) : [],
        recurrence_rule: ruleStr,
        recurrence_parent_id: parentId,
        scheduled_date: dateStr,
        scheduled_slot: parent.scheduled_slot as string | null,
        estimated_mins: parent.estimated_mins as number | null,
        source_connector: 'manual',
      };

      createTask(newTask);
      createdCount++;
    } catch (err) {
      console.error(`Failed to process recurrence for task ${parentId}:`, err);
    }
  }

  // 2. Process active templates with recurrence rules
  const templates = db.prepare(`
    SELECT * FROM task_templates
    WHERE is_active = 1
    AND recurrence_rule IS NOT NULL
    AND recurrence_rule != ''
  `).all() as Record<string, unknown>[];

  for (const template of templates) {
    const ruleStr = template.recurrence_rule as string;
    const templateId = template.id as string;

    try {
      const rule = RRule.fromString(ruleStr);
      const now = new Date();
      const nextDates = rule.between(
        new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
        new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
        true
      );

      for (const nextDate of nextDates) {
        const dateStr = nextDate.toISOString().split('T')[0];

        // Check if instance already exists
        const existing = db.prepare(`
          SELECT id FROM tasks
          WHERE source_connector = 'template'
          AND source_id = ?
          AND scheduled_date = ?
        `).get(templateId, dateStr);

        if (existing) continue;

        const templateData = JSON.parse(template.template_data as string) as NewTask;
        const newTask: NewTask = {
          ...templateData,
          scheduled_date: dateStr,
          source_connector: 'template',
          source_id: templateId,
        };

        createTask(newTask);
        createdCount++;
      }
    } catch (err) {
      console.error(`Failed to process template recurrence ${templateId}:`, err);
    }
  }

  if (createdCount > 0) {
    console.log(`Recurrence engine created ${createdCount} task(s)`);
  }

  return createdCount;
}

/**
 * Helper: Build an RRULE string from user-friendly options
 */
export function buildRRule(options: {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  daysOfWeek?: number[]; // 0=Mon, 1=Tue, ..., 6=Sun (RRule uses MO,TU,...)
  endDate?: string;
  count?: number;
}): string {
  const dayMap = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];

  const ruleOptions: Record<string, unknown> = {
    freq: options.frequency === 'daily' ? RRule.DAILY
      : options.frequency === 'weekly' ? RRule.WEEKLY
      : RRule.MONTHLY,
    interval: options.interval || 1,
  };

  if (options.daysOfWeek && options.daysOfWeek.length > 0) {
    ruleOptions.byweekday = options.daysOfWeek.map(d => dayMap[d]);
  }

  if (options.endDate) {
    ruleOptions.until = new Date(options.endDate);
  }

  if (options.count) {
    ruleOptions.count = options.count;
  }

  const rule = new RRule(ruleOptions as any);
  return rule.toString();
}

/**
 * Helper: Get human-readable description of an RRULE
 */
export function describeRRule(ruleStr: string): string {
  try {
    const rule = RRule.fromString(ruleStr);
    return rule.toText();
  } catch {
    return ruleStr;
  }
}
