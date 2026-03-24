import React from 'react';
import { useViewStore } from '@/stores/view-store';
import { useTaskStore } from '@/stores/task-store';
import type { ViewType } from '@shared/types';

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'kanban',
    label: 'Kanban',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'week',
    label: 'Week',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <path d="M4 6h16M4 12h10M4 18h14" />
      </svg>
    ),
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'recurrence',
    label: 'Recurring',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useViewStore();
  const tasks = useTaskStore((s) => s.tasks);

  // Badge counts
  const overdueCount = tasks.filter(
    (t) => t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'done' && t.status !== 'archived'
  ).length;

  const unscheduledCount = tasks.filter(
    (t) => t.due_date && !t.scheduled_date && t.status !== 'done' && t.status !== 'archived'
  ).length;

  return (
    <div
      className={`flex flex-col items-center py-3 gap-1 border-r border-subtle bg-[#0b0d12] transition-all duration-200 ${
        sidebarCollapsed ? 'w-[52px]' : 'w-[180px]'
      }`}
    >
      {/* Logo area */}
      <div className="w-9 h-9 mb-2 flex items-center justify-center">
        <span className="text-indigo-400 font-bold text-sm">TF</span>
      </div>

      {/* Nav items */}
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        const badge =
          item.id === 'focus' && overdueCount > 0
            ? overdueCount
            : item.id === 'week' && unscheduledCount > 0
            ? unscheduledCount
            : null;

        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
              sidebarCollapsed ? 'w-9 h-9 justify-center' : 'w-full px-3 h-9 justify-start'
            } ${
              isActive
                ? 'bg-indigo-500 text-white'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-400'
            }`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!sidebarCollapsed && (
              <span className="text-[13px] font-medium">{item.label}</span>
            )}
            {badge && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
                {badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={() => setView('settings')}
        className={`flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
          sidebarCollapsed ? 'w-9 h-9 justify-center' : 'w-full px-3 h-9 justify-start'
        } ${
          currentView === 'settings'
            ? 'bg-indigo-500 text-white'
            : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-400'
        }`}
        title={sidebarCollapsed ? 'Settings' : undefined}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        {!sidebarCollapsed && <span className="text-[13px] font-medium">Settings</span>}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 hover:bg-white/5 hover:text-zinc-400 mt-1"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
