import React from 'react';
import { useViewStore } from '@/stores/view-store';
import { useTaskStore } from '@/stores/task-store';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ViewType } from '@shared/types';
import { isToday, isPast, parseISO } from 'date-fns';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

// Simple SVG icons
const icons = {
  kanban: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" />
    </svg>
  ),
  week: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
    </svg>
  ),
  timeline: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m7 16 4-8 4 4 4-8" />
    </svg>
  ),
  focus: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  recurrence: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  collapse: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" />
    </svg>
  ),
  expand: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" />
    </svg>
  ),
};

const navItems: NavItem[] = [
  { id: 'kanban', label: 'Kanban', icon: icons.kanban },
  { id: 'week', label: 'Week', icon: icons.week },
  { id: 'timeline', label: 'Timeline', icon: icons.timeline },
  { id: 'focus', label: 'Focus', icon: icons.focus },
  { id: 'recurrence', label: 'Recurring', icon: icons.recurrence },
];

export function Sidebar() {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useViewStore();
  const tasks = useTaskStore((s) => s.tasks);

  // Count overdue tasks
  const overdueCount = tasks.filter((t) => {
    if (t.status === 'done' || t.status === 'archived' || !t.due_date) return false;
    const date = parseISO(t.due_date);
    return isPast(date) && !isToday(date);
  }).length;

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-[200px]'
        } bg-card border-r border-border flex flex-col transition-all duration-200 ease-in-out shrink-0`}
      >
        {/* Logo */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} h-14 border-b border-border`}>
          <span className="font-bold text-lg text-primary">
            {sidebarCollapsed ? 'TF' : 'TaskForge'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const badge = item.id === 'kanban' && overdueCount > 0 ? overdueCount : null;

            const button = (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                } ${sidebarCollapsed ? 'justify-center mx-2' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                    {badge ? ` (${badge} overdue)` : ''}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return button;
          })}
        </nav>

        <Separator />

        {/* Settings */}
        <div className="py-2">
          {(() => {
            const isActive = currentView === 'settings';
            const button = (
              <button
                onClick={() => setView('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                } ${sidebarCollapsed ? 'justify-center mx-2' : ''}`}
              >
                <span className="shrink-0">{icons.settings}</span>
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
              );
            }
            return button;
          })()}
        </div>

        {/* Collapse toggle */}
        <div className="border-t border-border p-2">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center py-1.5 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            {sidebarCollapsed ? icons.expand : icons.collapse}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
