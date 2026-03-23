import { getDb } from './index';
import type { ActivityLogEntry } from '../../shared/types';

export function getRecentActivity(limit = 50): ActivityLogEntry[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM activity_log ORDER BY id DESC LIMIT ?'
  ).all(limit) as Record<string, unknown>[];

  return rows.map(row => ({
    ...row,
    old_value: row.old_value ? JSON.parse(row.old_value as string) : null,
    new_value: row.new_value ? JSON.parse(row.new_value as string) : null,
  })) as ActivityLogEntry[];
}

export function undoLastAction(): boolean {
  const db = getDb();
  const lastEntry = db.prepare(
    'SELECT * FROM activity_log ORDER BY id DESC LIMIT 1'
  ).get() as Record<string, unknown> | undefined;

  if (!lastEntry) return false;

  const action = lastEntry.action as string;
  const taskId = lastEntry.task_id as string;
  const oldValue = lastEntry.old_value ? JSON.parse(lastEntry.old_value as string) : null;

  try {
    db.transaction(() => {
      switch (action) {
        case 'created':
          // Undo creation = delete the task
          db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
          break;

        case 'deleted':
          // Undo deletion = re-insert the task
          if (oldValue) {
            const columns = Object.keys(oldValue);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map((col: string) => {
              const val = oldValue[col];
              if (typeof val === 'object' && val !== null) return JSON.stringify(val);
              return val;
            });
            db.prepare(
              `INSERT OR REPLACE INTO tasks (${columns.join(', ')}) VALUES (${placeholders})`
            ).run(...values);
          }
          break;

        case 'updated':
        case 'moved':
          // Undo update = restore old values
          if (oldValue && taskId) {
            const setClauses = Object.keys(oldValue).map(col => `${col} = ?`).join(', ');
            const values = Object.keys(oldValue).map((col: string) => {
              const val = oldValue[col];
              if (typeof val === 'object' && val !== null) return JSON.stringify(val);
              return val;
            });
            db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`).run(...values, taskId);
          }
          break;
      }

      // Remove the undone log entry
      db.prepare('DELETE FROM activity_log WHERE id = ?').run(lastEntry.id);
    })();

    return true;
  } catch (err) {
    console.error('Undo failed:', err);
    return false;
  }
}
