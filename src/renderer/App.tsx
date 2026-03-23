import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanView } from './views/KanbanView';
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

  // Load tasks and settings on mount
  useEffect(() => {
    loadTasks();
    loadSettings();
  }, [loadTasks, loadSettings]);

  // Listen for quick-add trigger from tray
  useEffect(() => {
    const cleanup = window.taskforge.on.quickAdd(() => {
      // Will be handled by QuickAddBar component via a global event
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
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useTaskStore.getState().undo();
      }
      // 1-4 → Set priority on selected task
      if (['1', '2', '3', '4'].includes(e.key) && !e.ctrlKey && !isInputFocused()) {
        const priority = parseInt(e.key) - 1; // 1→0(none), 2→1(low), 3→2(med), 4→3(high)
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
      case 'kanban':
        return <KanbanView />;
      case 'settings':
        return <SettingsView />;
      // Phase 2 views — render placeholder for now
      case 'week':
        return <PlaceholderView name="Weekly Planner" phase={2} />;
      case 'timeline':
        return <PlaceholderView name="Timeline" phase={2} />;
      case 'focus':
        return <PlaceholderView name="Focus Mode" phase={2} />;
      case 'recurrence':
        return <PlaceholderView name="Recurring Tasks" phase={2} />;
      default:
        return <KanbanView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}

function PlaceholderView({ name, phase }: { name: string; phase: number }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-muted-foreground">
        <h2 className="text-2xl font-semibold mb-2">{name}</h2>
        <p>Coming in Phase {phase}</p>
      </div>
    </div>
  );
}
