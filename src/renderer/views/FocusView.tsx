import React, { useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { FocusTaskCard } from '@/components/FocusTaskCard';
import { CompletedRow } from '@/components/CompletedRow';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { format, parseISO, isToday, isPast, addDays, isWithinInterval } from 'date-fns';

export function FocusView() {
  const { tasks, updateTask } = useTaskStore();
  const { openTaskDetail } = useViewStore();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const overdueTasks = useMemo(
    () => tasks
      .filter((t) => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done' && t.status !== 'archived')
      .sort((a, b) => b.priority - a.priority),
    [tasks]
  );

  const dueTodayTasks = useMemo(
    () => tasks
      .filter((t) => t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'done' && t.status !== 'archived')
      .sort((a, b) => b.priority - a.priority),
    [tasks]
  );

  const upcomingTasks = useMemo(() => {
    if (overdueTasks.length + dueTodayTasks.length >= 5) return [];
    const tomorrow = addDays(now, 1);
    const weekEnd = addDays(now, 7);
    return tasks
      .filter((t) => t.due_date && t.status !== 'done' && t.status !== 'archived' &&
        isWithinInterval(parseISO(t.due_date), { start: tomorrow, end: weekEnd }))
      .sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  }, [tasks, overdueTasks.length, dueTodayTasks.length]);

  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed_at && isToday(parseISO(t.completed_at))),
    [tasks]
  );

  const handleComplete = async (id: string) => {
    await updateTask(id, { status: 'done' });
  };

  const handleStart = async (id: string) => {
    await updateTask(id, { status: 'in_progress' });
  };

  const focusCount = overdueTasks.length + dueTodayTasks.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-lg font-bold"><span className="text-[#6366f1]">Task</span><span className="text-[#e2e2e6]">Forge</span></span>
        <span className="text-sm text-[#a5a5af]">{format(now, 'EEEE, d MMMM yyyy')}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-6 py-8">
          {/* Greeting */}
          <h1 className="text-3xl font-bold text-[#e2e2e6]">{greeting}, Deepak</h1>
          <p className="text-[#a5a5af] mt-1">
            You have {focusCount} task{focusCount !== 1 ? 's' : ''} to focus on today
            {overdueTasks.length > 0 ? `, ${overdueTasks.length} ${overdueTasks.length === 1 ? 'is' : 'are'} overdue` : ''}.
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-[8px] bg-[#12141b] border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#6b7280] uppercase tracking-wider">Overdue</p>
              <p className="text-3xl font-bold text-[#ef4444] mt-1">{overdueTasks.length}</p>
            </div>
            <div className="p-4 rounded-[8px] bg-[#12141b] border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#6b7280] uppercase tracking-wider">Due today</p>
              <p className="text-3xl font-bold text-[#f59e0b] mt-1">{dueTodayTasks.length}</p>
            </div>
            <div className="p-4 rounded-[8px] bg-[#12141b] border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#6b7280] uppercase tracking-wider">Completed today</p>
              <p className="text-3xl font-bold text-[#22c55e] mt-1">{completedToday.length}</p>
            </div>
          </div>

          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af]">Overdue</h2>
                <span className="text-xs text-[#6b7280]">{overdueTasks.length} task{overdueTasks.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <FocusTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task.id)}
                    onStart={() => handleStart(task.id)}
                    onClick={() => openTaskDetail(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due today section */}
          {dueTodayTasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af]">Due today</h2>
                <span className="text-xs text-[#6b7280]">{dueTodayTasks.length} task{dueTodayTasks.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {dueTodayTasks.map((task) => (
                  <FocusTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task.id)}
                    onStart={() => handleStart(task.id)}
                    onClick={() => openTaskDetail(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming this week (only if overdue+today < 5) */}
          {upcomingTasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af]">Upcoming this week</h2>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <FocusTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task.id)}
                    onStart={() => handleStart(task.id)}
                    onClick={() => openTaskDetail(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed today */}
          {completedToday.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af]">Completed today</h2>
              </div>
              <div className="space-y-2">
                {completedToday.map((task) => (
                  <CompletedRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {focusCount === 0 && completedToday.length === 0 && (
            <div className="mt-12 text-center text-[#6b7280]">
              <p className="text-lg">All clear for today!</p>
              <p className="text-sm mt-1">No overdue or due tasks. Great work.</p>
            </div>
          )}
        </div>
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
