import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanView } from './views/KanbanView';
import { WeekView } from './views/WeekView';
import { TimelineView } from './views/TimelineView';
import { FocusView } from './views/FocusView';
import { RecurrenceView } from './views/RecurrenceView';
import { SettingsView } from './views/SettingsView';
import { useViewStore } from './stores/view-store';
import { useTaskStore } from './stores/task-store';
import { useSettingsStore } from './stores/settings-store';
import type { TaskPriority } from '@shared/types';

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
}

export default function App() {
  const { currentView, setView } = useViewStore();
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const theme = useSettingsStore((s) => s.settings.theme);

  // Load data on mount
  useEffect(() => {
    loadTasks();
    loadSettings();
  }, [loadTasks, loadSettings]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    }
  }, [theme]);

  // Listen for quick-add trigger from tray
  useEffect(() => {
    if (!window.taskforge?.on?.quickAdd) return;
    const cleanup = window.taskforge.on.quickAdd(() => {
      window.dispatchEvent(new CustomEvent('taskforge:quick-add'));
    });
    return cleanup;
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+N → Quick Add
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('taskforge:quick-add'));
      }
      // Ctrl+Z → Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useTaskStore.getState().undo();
      }
      // Ctrl+1-5 → View switching
      if (e.ctrlKey && !e.shiftKey) {
        const viewMap: Record<string, typeof currentView> = {
          '1': 'kanban',
          '2': 'week',
          '3': 'timeline',
          '4': 'focus',
          '5': 'recurrence',
        };
        if (viewMap[e.key]) {
          e.preventDefault();
          setView(viewMap[e.key]);
        }
      }
      // 1-4 → Set priority on selected task (when not in input)
      if (['1', '2', '3', '4'].includes(e.key) && !e.ctrlKey && !e.altKey && !isInputFocused()) {
        const priority = (parseInt(e.key) - 1) as TaskPriority;
        const selectedId = useViewStore.getState().selectedTaskId;
        if (selectedId) {
          useTaskStore.getState().updateTask(selectedId, { priority });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setView]);

  const renderView = () => {
    switch (currentView) {
      case 'kanban': return <KanbanView />;
      case 'week': return <WeekView />;
      case 'timeline': return <TimelineView />;
      case 'focus': return <FocusView />;
      case 'recurrence': return <RecurrenceView />;
      case 'settings': return <SettingsView />;
      default: return <KanbanView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{renderView()}</main>
    </div>
  );
}
