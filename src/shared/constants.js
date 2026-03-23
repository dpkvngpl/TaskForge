"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = exports.SCHEDULED_SLOTS = exports.DEFAULT_CATEGORIES = exports.DEFAULT_KANBAN_COLUMNS = exports.STATUS_LABELS = exports.PRIORITY_COLORS = exports.PRIORITY_LABELS = void 0;
exports.PRIORITY_LABELS = {
    0: 'None',
    1: 'Low',
    2: 'Medium',
    3: 'High',
};
exports.PRIORITY_COLORS = {
    0: '#6b7280', // gray-500
    1: '#3b82f6', // blue-500
    2: '#f59e0b', // amber-500
    3: '#ef4444', // red-500
};
exports.STATUS_LABELS = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    archived: 'Archived',
};
exports.DEFAULT_KANBAN_COLUMNS = [
    { id: 'col-todo', label: 'To Do', status: 'todo' },
    { id: 'col-in-progress', label: 'In Progress', status: 'in_progress' },
    { id: 'col-done', label: 'Done', status: 'done' },
];
exports.DEFAULT_CATEGORIES = [
    'job-search',
    'ipcos',
    'personal',
    'technical',
    'admin',
];
exports.SCHEDULED_SLOTS = ['morning', 'afternoon', 'evening'];
exports.DEFAULT_SETTINGS = {
    theme: 'dark',
    defaultPriority: 2,
    defaultCategory: null,
    categories: exports.DEFAULT_CATEGORIES,
    kanbanColumns: exports.DEFAULT_KANBAN_COLUMNS,
    minimizeToTray: true,
    reminderMinutesBefore: 15,
};
