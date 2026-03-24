import React, { useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { PriorityBadge } from '@/components/PriorityBadge';
import { expandRecurringTasks } from '@/lib/recurrence-utils';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, addDays, startOfWeek, isToday, differenceInDays, isWeekend } from 'date-fns';
import type { Task } from '@shared/types';

type Zoom = '1week' | '2weeks' | 'month';
const zoomDays: Record<Zoom, number> = { '1week': 7, '2weeks': 14, month: 30 };
const colWidth: Record<Zoom, number> = { '1week': 56, '2weeks': 48, month: 24 };

export function TimelineView() {
  const { tasks } = useTaskStore();
  const { openTaskDetail } = useViewStore();
  const [zoom, setZoom] = useState<Zoom>('2weeks');

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const dayCount = zoomDays[zoom];
  const cellW = colWidth[zoom];

  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i)), [weekStart, dayCount]);

  // Filter tasks + projected recurring instances
  const timelineTasks = useMemo(() => {
    const startStr = format(days[0], 'yyyy-MM-dd');
    const endStr = format(days[dayCount - 1], 'yyyy-MM-dd');
    const projected = expandRecurringTasks(tasks, startStr, endStr);
    const all = [...tasks, ...projected];
    return all
      .filter((t) => (t.due_date || t.scheduled_date) && t.status !== 'archived')
      .sort((a, b) => {
        const aDate = a.scheduled_date || a.due_date || '';
        const bDate = b.scheduled_date || b.due_date || '';
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return b.priority - a.priority;
      })
      .slice(0, 30);
  }, [tasks, days, dayCount]);

  const startDate = days[0];

  // Calculate bar position for a task
  const getBar = (task: Task) => {
    const taskStart = task.scheduled_date || task.due_date;
    if (!taskStart) return null;

    const startDay = differenceInDays(new Date(taskStart), startDate);
    const duration = task.estimated_mins ? Math.max(1, Math.ceil(task.estimated_mins / (8 * 60))) : 1; // days

    return {
      left: Math.max(0, startDay) * cellW,
      width: Math.max(cellW, duration * cellW),
    };
  };

  // Today line position
  const todayOffset = differenceInDays(new Date(), startDate) * cellW + cellW / 2;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[15px] font-medium text-zinc-200">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <div className="flex items-center gap-px ml-auto surface rounded-md p-0.5">
          {(['1week', '2weeks', 'month'] as Zoom[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1 rounded text-[12px] transition-colors ${
                zoom === z ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {z === '1week' ? '1 week' : z === '2weeks' ? '2 weeks' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task list */}
        <div className="w-[220px] border-r border-white/[0.04] flex flex-col">
          <div className="px-3.5 py-2 text-[11px] font-medium text-zinc-600 uppercase tracking-wide border-b border-white/[0.04]">
            Tasks
          </div>
          <div className="flex-1 overflow-y-auto">
            {timelineTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => openTaskDetail(task.id)}
                className="flex items-center gap-2 px-3.5 h-[38px] border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02]"
              >
                <PriorityBadge priority={task.priority} variant="dot" />
                <span className="text-[12px] text-zinc-300 truncate flex-1">{task.title}</span>
                <span className="text-[10px] text-zinc-600 bg-white/5 px-1 py-px rounded flex-shrink-0">
                  {task.category?.slice(0, 4) || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt grid — uses flex:1 columns to fill width */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day headers */}
          <div className="flex border-b border-white/[0.04] flex-shrink-0">
            {days.map((day) => {
              const today = isToday(day);
              const weekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 text-center py-1.5 border-r border-white/[0.03] ${
                    today ? 'bg-indigo-500/[0.06]' : ''
                  }`}
                >
                  <div className={`text-[10px] ${today ? 'text-indigo-300' : weekend ? 'text-zinc-700' : 'text-zinc-600'}`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-[13px] font-medium mt-px ${today ? 'text-indigo-300' : weekend ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gantt rows — bars use percentage positioning */}
          <div className="flex-1 overflow-y-auto relative">
            {timelineTasks.map((task) => {
              const bar = getBar(task);
              // Convert pixel bar to percentage
              const barPct = bar ? {
                left: `${(bar.left / (dayCount * cellW)) * 100}%`,
                width: `${(bar.width / (dayCount * cellW)) * 100}%`,
              } : null;

              return (
                <div key={task.id} className="flex h-[38px] border-b border-white/[0.03] relative">
                  {/* Background cells */}
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`flex-1 border-r border-white/[0.03] ${
                        isToday(day) ? 'bg-indigo-500/[0.03]' : isWeekend(day) ? 'bg-white/[0.008]' : ''
                      }`}
                    />
                  ))}
                  {/* Task bar */}
                  {barPct && (
                    <div
                      onClick={() => !task.id.startsWith('projected-') && openTaskDetail(task.id)}
                      className={`absolute top-2 h-[22px] rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-1.5 text-[10px] font-medium text-white overflow-hidden whitespace-nowrap ${
                        task.source_connector === 'recurrence' ? 'border border-dashed border-violet-400/50' : ''
                      }`}
                      style={{
                        left: barPct.left,
                        width: barPct.width,
                        minWidth: 24,
                        backgroundColor: task.source_connector === 'recurrence'
                          ? 'rgba(139,92,246,0.5)'
                          : task.status === 'done'
                            ? 'rgba(34,197,94,0.4)'
                            : PRIORITY_COLORS[task.priority],
                        opacity: task.status === 'in_progress' ? 0.7 : 1,
                      }}
                    >
                      {task.title.slice(0, 25)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Today line */}
            {todayOffset > 0 && todayOffset < dayCount * cellW && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-indigo-500/50 z-10 pointer-events-none"
                style={{ left: `${(todayOffset / (dayCount * cellW)) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-5 py-2 text-[12px] text-zinc-600 border-t border-white/[0.04]">
        <span><span className="text-indigo-300">{timelineTasks.length}</span> tasks across <span className="text-indigo-300">{zoom === '1week' ? '1 week' : zoom === '2weeks' ? '2 weeks' : '1 month'}</span></span>
        <div className="flex gap-3 ml-auto">
          {([3, 2, 1] as const).map((p) => (
            <span key={p} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
              <span className="text-zinc-500">{p === 3 ? 'High' : p === 2 ? 'Medium' : 'Low'}</span>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-violet-400" style={{ backgroundColor: 'rgba(139,92,246,0.5)' }} />
            <span className="text-zinc-500">Recurring</span>
          </span>
        </div>
      </div>

      <TaskDetailPanel />
    </div>
  );
}
