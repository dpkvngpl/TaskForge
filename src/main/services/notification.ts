import { Notification } from 'electron';
import * as cron from 'node-cron';
import { getDb } from '../database/index';
import { getSetting } from '../database/settings';

let cronJob: ReturnType<typeof cron.schedule> | null = null;
let mainWindow: Electron.BrowserWindow | null = null;

export function startNotificationService(window: Electron.BrowserWindow): void {
  mainWindow = window;

  // Run every 60 seconds
  cronJob = cron.schedule('* * * * *', () => {
    checkUpcomingReminders();
  });

  console.log('Notification service started');
}

export function stopNotificationService(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}

function checkUpcomingReminders(): void {
  const db = getDb();
  const reminderMinutes = parseInt(getSetting('reminderMinutesBefore') || '15', 10);

  const now = new Date();
  const windowEnd = new Date(now.getTime() + reminderMinutes * 60 * 1000);

  // Find tasks that:
  // 1. Have a due_date and due_time set
  // 2. Are not completed (status != 'done' and status != 'archived')
  // 3. Due datetime falls within [now, now + reminderMinutes]
  // 4. Haven't already been notified (use a simple in-memory set)
  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE status NOT IN ('done', 'archived')
    AND due_date IS NOT NULL
    AND due_time IS NOT NULL
    AND datetime(due_date || 'T' || due_time || ':00') BETWEEN datetime(?) AND datetime(?)
  `).all(
    now.toISOString(),
    windowEnd.toISOString()
  ) as Record<string, unknown>[];

  for (const task of tasks) {
    const taskId = task.id as string;

    // Check if we already notified for this task (avoid spam)
    if (notifiedTasks.has(taskId)) continue;
    notifiedTasks.add(taskId);

    // Fire native notification
    const notification = new Notification({
      title: 'TaskForge — Task due soon',
      body: `"${task.title}" is due at ${task.due_time}`,
      icon: undefined, // Uses app icon by default
      silent: false,
    });

    notification.on('click', () => {
      // Show window and send task ID to renderer
      mainWindow?.show();
      mainWindow?.focus();
      mainWindow?.webContents.send('task:reminder', {
        id: taskId,
        title: task.title,
      });
    });

    notification.show();
  }
}

// In-memory set of task IDs we've already notified about this session
// Resets when the app restarts — intentional (re-notify next session)
const notifiedTasks = new Set<string>();

// Also check for overdue tasks on startup
export function checkOverdueOnStartup(): number {
  const db = getDb();
  const now = new Date().toISOString().split('T')[0]; // Today's date

  const result = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE status NOT IN ('done', 'archived')
    AND due_date IS NOT NULL
    AND due_date < ?
  `).get(now) as { count: number };

  return result.count;
}
