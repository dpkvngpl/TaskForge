import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be available as window.taskforge in the renderer
const api = {
  tasks: {
    getAll: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('tasks:getAll', filters),
    getById: (id: string) =>
      ipcRenderer.invoke('tasks:getById', id),
    create: (task: Record<string, unknown>) =>
      ipcRenderer.invoke('tasks:create', task),
    update: (id: string, changes: Record<string, unknown>) =>
      ipcRenderer.invoke('tasks:update', id, changes),
    delete: (id: string) =>
      ipcRenderer.invoke('tasks:delete', id),
    reorder: (id: string, status: string, sortOrder: number) =>
      ipcRenderer.invoke('tasks:reorder', id, status, sortOrder),
    batchUpdateStatus: (ids: string[], status: string) =>
      ipcRenderer.invoke('tasks:batchUpdateStatus', ids, status),
  },

  templates: {
    getAll: () => ipcRenderer.invoke('templates:getAll'),
    create: (template: Record<string, unknown>) =>
      ipcRenderer.invoke('templates:create', template),
    update: (id: string, changes: Record<string, unknown>) =>
      ipcRenderer.invoke('templates:update', id, changes),
    delete: (id: string) =>
      ipcRenderer.invoke('templates:delete', id),
    createTaskFromTemplate: (templateId: string) =>
      ipcRenderer.invoke('templates:createTask', templateId),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },

  activityLog: {
    getRecent: (limit?: number) =>
      ipcRenderer.invoke('activityLog:getRecent', limit),
    undo: () => ipcRenderer.invoke('activityLog:undo'),
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    getDataPath: () => ipcRenderer.invoke('app:data-path'),
    minimize: () => ipcRenderer.send('app:minimize'),
    quit: () => ipcRenderer.send('app:quit'),
  },

  recurrence: {
    process: () => ipcRenderer.invoke('recurrence:process'),
    buildRRule: (options: Record<string, unknown>) => ipcRenderer.invoke('recurrence:buildRRule', options),
    describe: (ruleStr: string) => ipcRenderer.invoke('recurrence:describe', ruleStr),
    getNextDates: (ruleStr: string, count?: number) => ipcRenderer.invoke('recurrence:getNextDates', ruleStr, count),
  },

  notifications: {
    getOverdueCount: () => ipcRenderer.invoke('notifications:getOverdueCount'),
  },

  // Event listeners (main → renderer)
  on: {
    quickAdd: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('trigger:quick-add', handler);
      return () => ipcRenderer.removeListener('trigger:quick-add', handler);
    },
    taskReminder: (callback: (task: Record<string, unknown>) => void) => {
      const handler = (_event: unknown, task: Record<string, unknown>) => callback(task);
      ipcRenderer.on('task:reminder', handler);
      return () => ipcRenderer.removeListener('task:reminder', handler);
    },
  },
};

contextBridge.exposeInMainWorld('taskforge', api);
