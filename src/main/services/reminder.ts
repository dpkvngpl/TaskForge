import * as cron from 'node-cron';
import { Notification, BrowserWindow } from 'electron';
import { getAllTasks } from '../database/tasks';
import { getSetting } from '../database/settings';

let cronTask: ReturnType<typeof cron.schedule> | null = null;

export function startReminderService(mainWindow: BrowserWindow): void {
  // Check every minute for upcoming task reminders
  cronTask = cron.schedule('* * * * *', () => {
    checkReminders(mainWindow);
  });

  console.log('Reminder service started');
}

export function stopReminderService(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('Reminder service stopped');
  }
}

function checkReminders(mainWindow: BrowserWindow): void {
  try {
    const minutesBefore = parseInt(getSetting('reminderMinutesBefore') ?? '15', 10);
    const tasks = getAllTasks();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    for (const task of tasks) {
      if (task.status === 'done' || task.status === 'archived') continue;
      if (!task.due_date || !task.due_time) continue;
      if (task.due_date !== todayStr) continue;

      // Parse due time
      const [hours, mins] = task.due_time.split(':').map(Number);
      const dueDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins, 0);

      const minsUntilDue = Math.round((dueDateTime.getTime() - now.getTime()) / 60000);

      // Trigger notification if within the reminder window
      if (minsUntilDue > 0 && minsUntilDue <= minutesBefore && minsUntilDue >= minutesBefore - 1) {
        showNotification(task.title, minsUntilDue, task.category);

        mainWindow?.webContents.send('task:reminder', {
          id: task.id,
          title: task.title,
          due_time: task.due_time,
          category: task.category,
        });
      }
    }
  } catch (err) {
    console.error('Reminder check failed:', err);
  }
}

function showNotification(title: string, minsUntilDue: number, category: string | null): void {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: 'TaskForge Reminder',
    body: `"${title}" is due in ${minsUntilDue} minute${minsUntilDue !== 1 ? 's' : ''}${category ? ` (${category})` : ''}`,
    silent: false,
  });

  notification.show();
}
