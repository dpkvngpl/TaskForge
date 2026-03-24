import { create } from 'zustand';
import type { ViewType } from '@shared/types';

interface ViewState {
  currentView: ViewType;
  sidebarCollapsed: boolean;
  selectedTaskId: string | null;
  isTaskDetailOpen: boolean;
  isTaskFormOpen: boolean;
  editingTaskId: string | null; // null = creating new task

  setView: (view: ViewType) => void;
  toggleSidebar: () => void;
  selectTask: (id: string | null) => void;
  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
  openTaskForm: (editId?: string | null) => void;
  closeTaskForm: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: 'focus',
  sidebarCollapsed: false,
  selectedTaskId: null,
  isTaskDetailOpen: false,
  isTaskFormOpen: false,
  editingTaskId: null,

  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  selectTask: (id) => set({ selectedTaskId: id }),
  openTaskDetail: (id) => set({ selectedTaskId: id, isTaskDetailOpen: true }),
  closeTaskDetail: () => set({ isTaskDetailOpen: false, selectedTaskId: null }),
  openTaskForm: (editId = null) => set({ isTaskFormOpen: true, editingTaskId: editId }),
  closeTaskForm: () => set({ isTaskFormOpen: false, editingTaskId: null }),
}));
