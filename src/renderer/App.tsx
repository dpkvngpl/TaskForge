import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanView } from './views/KanbanView';
import { WeekView } from './views/WeekView';
import { TimelineView } from './views/TimelineView';
import { FocusView } from './views/FocusView';
import { RecurringView } from './views/RecurringView';
import { SettingsView } from './views/SettingsView';
import { useViewStore } from './stores/view-store';
import { useTaskStore } from './stores/task-store';
import { useSettingsStore } from './stores/settings-store';
import type { TaskPriority } from '@shared/types';

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
}

export default function App() {
  const currentView = useViewStore((s) => s.currentView);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadTasks();
    loadSettings();
    // Apply dark class by default
    document.documentElement.classList.add('dark');
  }, [loadTasks, loadSettings]);

  useEffect(() => {
    const cleanup = window.taskforge.on.quickAdd(() => {
      window.dispatchEvent(new CustomEvent('taskforge:quick-add'));
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const viewMap: Record<string, 'kanban' | 'week' | 'timeline' | 'focus' | 'recurrence'> = {
      '1': 'kanban', '2': 'week', '3': 'timeline', '4': 'focus', '5': 'recurrence',
    };
    const handler = (e: KeyboardEvent) => {
      // Ctrl+N → Quick Add
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('taskforge:quick-add'));
      }
      // Ctrl+Z → Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useTaskStore.getState().undo();
      }
      // Ctrl+1-5 → Switch views
      if (e.ctrlKey && viewMap[e.key]) {
        e.preventDefault();
        useViewStore.getState().setView(viewMap[e.key]);
      }
      // 1-4 → Set priority on selected task (only when not in input)
      if (['1', '2', '3', '4'].includes(e.key) && !e.ctrlKey && !isInputFocused()) {
        const priority = parseInt(e.key) - 1;
        const selectedId = useViewStore.getState().selectedTaskId;
        if (selectedId) {
          useTaskStore.getState().updateTask(selectedId, { priority: priority as TaskPriority });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'kanban': return <KanbanView />;
      case 'week': return <WeekView />;
      case 'timeline': return <TimelineView />;
      case 'focus': return <FocusView />;
      case 'recurrence': return <RecurringView />;
      case 'settings': return <SettingsView />;
      default: return <KanbanView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f1a] text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        {renderView()}
      </main>
    </div>
  );
}
