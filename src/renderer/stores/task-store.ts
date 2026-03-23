import { create } from 'zustand';
import type { Task, NewTask, TaskFilters, TaskStatus } from '@shared/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  filters: TaskFilters;
  searchQuery: string;

  // Actions
  loadTasks: () => Promise<void>;
  createTask: (task: NewTask) => Promise<Task>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTask: (id: string, newStatus: TaskStatus, newSortOrder: number) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  undo: () => Promise<boolean>;

  // Derived getters
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filters: {},
  searchQuery: '',

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const filters = get().filters;
      const search = get().searchQuery;
      const queryFilters = search ? { ...filters, search } : filters;
      const tasks = await window.taskforge.tasks.getAll(queryFilters);
      set({ tasks, isLoading: false });
    } catch (err) {
      console.error('Failed to load tasks:', err);
      set({ isLoading: false });
    }
  },

  createTask: async (input: NewTask) => {
    const task = await window.taskforge.tasks.create(input);
    await get().loadTasks(); // Reload to get proper sort order
    return task;
  },

  updateTask: async (id: string, changes: Partial<Task>) => {
    await window.taskforge.tasks.update(id, changes);
    await get().loadTasks();
  },

  deleteTask: async (id: string) => {
    await window.taskforge.tasks.delete(id);
    await get().loadTasks();
  },

  reorderTask: async (id: string, newStatus: TaskStatus, newSortOrder: number) => {
    // Optimistic update for smooth drag-and-drop
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, sort_order: newSortOrder }
          : t
      ),
    }));

    try {
      await window.taskforge.tasks.reorder(id, newStatus, newSortOrder);
    } catch (err) {
      console.error('Reorder failed:', err);
      await get().loadTasks(); // Reload on failure
    }
  },

  setFilters: (newFilters: Partial<TaskFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().loadTasks();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().loadTasks();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().loadTasks();
  },

  undo: async () => {
    const success = await window.taskforge.activityLog.undo();
    if (success) {
      await get().loadTasks();
    }
    return success;
  },

  getTasksByStatus: (status: TaskStatus) => {
    return get()
      .tasks.filter((t) => t.status === status)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
}));
