import { ipcMain } from 'electron';
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask, reorderTask, batchUpdateStatus } from './database/tasks';
import { getSetting, setSetting, getAllSettings } from './database/settings';
import { getRecentActivity, undoLastAction } from './database/activity-log';
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate, createTaskFromTemplate } from './database/templates';
import { checkOverdueOnStartup } from './services/notification';
import type { NewTask } from '../shared/types';
import { processRecurrences, buildRRule, describeRRule } from './services/recurrence';
import { RRule } from 'rrule';
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

  // ---- Templates ----
  ipcMain.handle(IPC.TEMPLATES_GET_ALL, () => getAllTemplates());
  ipcMain.handle(IPC.TEMPLATES_CREATE, (_event, template) => createTemplate(template));
  ipcMain.handle(IPC.TEMPLATES_UPDATE, (_event, id: string, changes) => updateTemplate(id, changes));
  ipcMain.handle(IPC.TEMPLATES_DELETE, (_event, id: string) => { deleteTemplate(id); });
  ipcMain.handle(IPC.TEMPLATES_CREATE_TASK, (_event, templateId: string) => createTaskFromTemplate(templateId));

  // ---- Notifications ----
  ipcMain.handle(IPC.NOTIFICATIONS_GET_OVERDUE_COUNT, () => {
    return checkOverdueOnStartup();
  });

  // ---- Connectors ----
  ipcMain.handle(IPC.CONNECTOR_LIST, () => {
    const { connectorManager } = require('./index');
    return connectorManager.getAll().map((c: any) => ({
      id: c.id, name: c.name, icon: c.icon,
      authenticated: c.isAuthenticated(),
      lastSync: c.getLastSyncTime()?.toISOString() || null,
    }));
  });

  ipcMain.handle(IPC.CONNECTOR_AUTHENTICATE, async (_event, connectorId: string) => {
    const { connectorManager } = require('./index');
    const connector = connectorManager.get(connectorId);
    if (!connector) throw new Error(`Connector not found: ${connectorId}`);
    await connector.authenticate();
    return { success: true };
  });

  ipcMain.handle(IPC.CONNECTOR_DEAUTHENTICATE, async (_event, connectorId: string) => {
    const { connectorManager } = require('./index');
    const connector = connectorManager.get(connectorId);
    if (!connector) throw new Error(`Connector not found: ${connectorId}`);
    await connector.deauthenticate();
    return { success: true };
  });

  ipcMain.handle(IPC.CONNECTOR_FETCH, async (_event, connectorId: string, options?) => {
    const { connectorManager } = require('./index');
    return connectorManager.fetchFrom(connectorId, options);
  });

  ipcMain.handle(IPC.CONNECTOR_CONVERT_TO_TASK, async (_event, connectorId: string, item) => {
    const { connectorManager } = require('./index');
    const connector = connectorManager.get(connectorId);
    if (!connector) throw new Error(`Connector not found: ${connectorId}`);
    const taskData = connector.toTask(item);
    return createTask(taskData as NewTask);
  });

  // ---- Recurrence ----
  ipcMain.handle(IPC.RECURRENCE_PROCESS, () => {
    return processRecurrences();
  });

  ipcMain.handle(IPC.RECURRENCE_BUILD_RRULE, (_event, options) => {
    return buildRRule(options);
  });

  ipcMain.handle(IPC.RECURRENCE_DESCRIBE, (_event, ruleStr: string) => {
    return describeRRule(ruleStr);
  });

  ipcMain.handle(IPC.RECURRENCE_GET_NEXT_DATES, (_event, ruleStr: string, count: number = 5) => {
    try {
      const rule = RRule.fromString(ruleStr);
      const dates = rule.all((_, i) => i < count);
      return dates.map(d => d.toISOString().split('T')[0]);
    } catch {
      return [];
    }
  });
}
