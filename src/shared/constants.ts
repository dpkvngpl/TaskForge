import type { TaskPriority, TaskStatus, KanbanColumn } from './types';

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  0: '#6b7280', // gray-500
  1: '#3b82f6', // blue-500
  2: '#f59e0b', // amber-500
  3: '#ef4444', // red-500
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  archived: 'Archived',
};

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'col-todo', label: 'To Do', status: 'todo' },
  { id: 'col-in-progress', label: 'In Progress', status: 'in_progress' },
  { id: 'col-done', label: 'Done', status: 'done' },
];

export const DEFAULT_CATEGORIES: string[] = [
  'job-search',
  'ipcos',
  'personal',
  'technical',
  'admin',
];

export const SCHEDULED_SLOTS = ['morning', 'afternoon', 'evening'] as const;

export const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  defaultPriority: 2 as TaskPriority,
  defaultCategory: null,
  categories: DEFAULT_CATEGORIES,
  kanbanColumns: DEFAULT_KANBAN_COLUMNS,
  minimizeToTray: true,
  reminderMinutesBefore: 15,
};
