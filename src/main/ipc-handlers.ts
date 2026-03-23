import { ipcMain } from 'electron';
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask, reorderTask, batchUpdateStatus } from './database/tasks';
import { getSetting, setSetting, getAllSettings } from './database/settings';
import { getRecentActivity, undoLastAction } from './database/activity-log';
import { checkOverdueOnStartup } from './services/notification';
import { IPC } from '../shared/ipc-channels';

export function registerTaskHandlers(): void {
  // ---- Tasks ----
  ipcMain.handle(IPC.TASKS_GET_ALL, (_event, filters) => {
    return getAllTasks(filters);
  });

  ipcMain.handle(IPC.TASKS_GET_BY_ID, (_event, id: string) => {
    return getTaskById(id);
  });

  ipcMain.handle(IPC.TASKS_CREATE, (_event, task) => {
    return createTask(task);
  });

  ipcMain.handle(IPC.TASKS_UPDATE, (_event, id: string, changes) => {
    return updateTask(id, changes);
  });

  ipcMain.handle(IPC.TASKS_DELETE, (_event, id: string) => {
    deleteTask(id);
  });

  ipcMain.handle(IPC.TASKS_REORDER, (_event, id: string, status: string, sortOrder: number) => {
    return reorderTask(id, status, sortOrder);
  });

  ipcMain.handle(IPC.TASKS_BATCH_UPDATE_STATUS, (_event, ids: string[], status: string) => {
    return batchUpdateStatus(ids, status);
  });

  // ---- Settings ----
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    return getSetting(key);
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: string) => {
    setSetting(key, value);
  });

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    return getAllSettings();
  });

  // ---- Activity Log ----
  ipcMain.handle(IPC.ACTIVITY_LOG_GET_RECENT, (_event, limit?: number) => {
    return getRecentActivity(limit);
  });

  ipcMain.handle(IPC.ACTIVITY_LOG_UNDO, () => {
    return undoLastAction();
  });

  // ---- Notifications ----
  ipcMain.handle(IPC.NOTIFICATIONS_GET_OVERDUE_COUNT, () => {
    return checkOverdueOnStartup();
  });
}
