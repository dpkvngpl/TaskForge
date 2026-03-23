// This file is referenced by the renderer to get types for window.taskforge
// Import the shared types
import type { Task, NewTask, TaskFilters, TaskTemplate, ActivityLogEntry } from '../shared/types';

export interface TaskForgeAPI {
  tasks: {
    getAll: (filters?: TaskFilters) => Promise<Task[]>;
    getById: (id: string) => Promise<Task | null>;
    create: (task: NewTask) => Promise<Task>;
    update: (id: string, changes: Partial<Task>) => Promise<Task>;
    delete: (id: string) => Promise<void>;
    reorder: (id: string, status: string, sortOrder: number) => Promise<void>;
    batchUpdateStatus: (ids: string[], status: string) => Promise<void>;
  };

  templates: {
    getAll: () => Promise<TaskTemplate[]>;
    create: (template: Omit<TaskTemplate, 'id' | 'created_at'>) => Promise<TaskTemplate>;
    delete: (id: string) => Promise<void>;
    createTaskFromTemplate: (templateId: string) => Promise<Task>;
  };

  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    getAll: () => Promise<Record<string, string>>;
  };

  activityLog: {
    getRecent: (limit?: number) => Promise<ActivityLogEntry[]>;
    undo: () => Promise<boolean>;
  };

  app: {
    getVersion: () => Promise<string>;
    getDataPath: () => Promise<string>;
    minimize: () => void;
    quit: () => void;
  };

  on: {
    quickAdd: (callback: () => void) => () => void;
    taskReminder: (callback: (task: Task) => void) => () => void;
  };
}

declare global {
  interface Window {
    taskforge: TaskForgeAPI;
  }
}
