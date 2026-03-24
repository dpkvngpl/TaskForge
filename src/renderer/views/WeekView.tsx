import React, { useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { PriorityBadge } from '@/components/PriorityBadge';
import { CategoryChip } from '@/components/CategoryChip';
import { expandRecurringTasks } from '@/lib/recurrence-utils';
import { format, startOfWeek, addDays, isToday, isSameDay, addWeeks, subWeeks } from 'date-fns';
import type { Task } from '@shared/types';

const SLOTS = ['morning', 'afternoon', 'evening'] as const;

function WeekTaskBlock({ task, onClick }: { task: Task; onClick: () => void }) {
  const isProjected = task.source_connector === 'recurrence';
  const borderMap = { 3: 'border-l-red-500', 2: 'border-l-amber-500', 1: 'border-l-blue-500', 0: 'border-l-zinc-600' } as const;
  const bgMap = { 3: 'bg-red-500/[0.06]', 2: 'bg-amber-500/[0.06]', 1: 'bg-blue-500/[0.06]', 0: 'bg-zinc-500/[0.06]' } as const;

  return (
    <div
      onClick={onClick}
      className={`rounded-md px-1.5 py-1 border-l-2 cursor-pointer hover:opacity-80 transition-opacity ${
        isProjected ? 'border-l-violet-500 bg-violet-500/[0.06] border-dashed' : `${borderMap[task.priority]} ${bgMap[task.priority]}`
      }`}
    >
      <div className="flex items-center gap-1">
        {isProjected && (
          <svg className="w-3 h-3 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" />
          </svg>
        )}
        <div className="text-[11px] font-medium text-zinc-200 leading-tight truncate">{task.title}</div>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {task.estimated_mins && (
          <span className="text-[10px] text-zinc-500">~{task.estimated_mins >= 60 ? `${Math.floor(task.estimated_mins / 60)}h` : `${task.estimated_mins}m`}</span>
        )}
        {task.category && <span className="text-[10px] text-zinc-500">&middot; {task.category}</span>}
      </div>
    </div>
  );
}

export function WeekView() {
  const { tasks, updateTask } = useTaskStore();
  const { openTaskDetail } = useViewStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekEnd = days[6];

  // Tasks scheduled this week + projected recurring instances
  const scheduledTasks = useMemo(() => {
    const start = format(days[0], 'yyyy-MM-dd');
    const end = format(days[6], 'yyyy-MM-dd');
    const real = tasks.filter(
      (t) => t.scheduled_date && t.scheduled_date >= start && t.scheduled_date <= end && t.status !== 'archived'
    );
    const projected = expandRecurringTasks(tasks, start, end);
    return [...real, ...projected];
  }, [tasks, days]);

  // Unscheduled tasks (have due date but no scheduled date)
  const unscheduled = useMemo(() => {
    return tasks.filter(
      (t) => t.due_date && !t.scheduled_date && t.status !== 'done' && t.status !== 'archived'
    ).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [tasks]);

  const getTasksForSlot = (day: Date, slot: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return scheduledTasks.filter((t) => t.scheduled_date === dateStr && t.scheduled_slot === slot);
  };

  const handleDropToSlot = async (taskId: string, day: Date, slot: string) => {
    await updateTask(taskId, {
      scheduled_date: format(day, 'yyyy-MM-dd'),
      scheduled_slot: slot,
    });
  };

  const scheduledCount = scheduledTasks.length;
  const doneCount = scheduledTasks.filter((t) => t.status === 'done').length;
  const progressPct = scheduledCount > 0 ? Math.round((doneCount / scheduledCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[15px] font-medium text-zinc-200">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="px-2 py-1 rounded-md border border-white/[0.08] text-zinc-400 text-[12px] hover:bg-white/5"
          >
            &larr;
          </button>
          <span className="text-[14px] font-medium text-zinc-200 min-w-[180px] text-center">
            {format(days[0], 'd')} &ndash; {format(days[6], 'd MMM yyyy')}
          </span>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="px-2 py-1 rounded-md border border-white/[0.08] text-zinc-400 text-[12px] hover:bg-white/5"
          >
            &rarr;
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-3 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[12px] hover:bg-indigo-500/25"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Week grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-white/[0.04]">
            <div /> {/* spacer for slot label column */}
            {days.map((day) => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`text-center py-2 ${today ? 'bg-indigo-500/[0.04]' : ''}`}
                >
                  <div className={`text-[11px] ${today ? 'text-indigo-300' : 'text-zinc-600'}`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-[17px] font-medium mt-px ${today ? 'text-indigo-300' : 'text-zinc-400'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slot rows */}
          <div className="flex-1 grid grid-cols-[72px_repeat(7,1fr)] grid-rows-3 overflow-hidden">
            {SLOTS.map((slot) => (
              <React.Fragment key={slot}>
                <div className="flex items-start justify-end pr-2 pt-2 text-[11px] text-zinc-600 capitalize border-b border-r border-white/[0.03]">
                  {slot}
                </div>
                {days.map((day) => {
                  const cellTasks = getTasksForSlot(day, slot);
                  const today = isToday(day);

                  return (
                    <div
                      key={`${day.toISOString()}-${slot}`}
                      className={`border-b border-r border-white/[0.03] p-1 flex flex-col gap-1 overflow-y-auto ${
                        today ? 'bg-indigo-500/[0.02]' : ''
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const taskId = e.dataTransfer.getData('taskId');
                        if (taskId) handleDropToSlot(taskId, day, slot);
                      }}
                    >
                      {cellTasks.map((task) => (
                        <WeekTaskBlock
                          key={task.id}
                          task={task}
                          onClick={() => openTaskDetail(task.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Unscheduled sidebar */}
        <div className="w-[200px] border-l border-white/[0.04] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.04]">
            <span className="text-[13px] font-medium text-zinc-300">Unscheduled</span>
            <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">{unscheduled.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {unscheduled.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                className="surface rounded-md p-2 border-l-[3px] cursor-grab active:cursor-grabbing"
                style={{
                  borderLeftColor:
                    task.priority === 3 ? '#ef4444' : task.priority === 2 ? '#f59e0b' : task.priority === 1 ? '#3b82f6' : '#374151',
                }}
              >
                <div className="text-[12px] font-medium text-zinc-200 leading-tight mb-0.5">{task.title}</div>
                <div className="text-[10px] text-zinc-600">
                  {task.due_date ? format(new Date(task.due_date), 'EEE d MMM') : 'No due date'}
                </div>
              </div>
            ))}
            {unscheduled.length === 0 && (
              <div className="text-center text-[11px] text-zinc-700 py-6">All tasks scheduled</div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-5 py-2 text-[12px] text-zinc-600 border-t border-white/[0.04]">
        Week progress: <span className="text-indigo-300">{doneCount}</span>/{scheduledCount} scheduled
        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-zinc-600">{progressPct}%</span>
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
