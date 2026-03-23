import React, { useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { PriorityBadge } from '@/components/PriorityBadge';
import { DueDateChip } from '@/components/DueDateChip';
import { CategoryChip } from '@/components/CategoryChip';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, parseISO, isToday, isPast } from 'date-fns';
import type { Task } from '@shared/types';

function FocusTaskCard({ task, onStart }: { task: Task; onStart: () => void }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl bg-[#1e1e35] border border-white/5 hover:border-white/10 transition-colors"
      style={{ borderLeftWidth: '3px', borderLeftColor: PRIORITY_COLORS[task.priority] }}
    >
      {/* Priority ring */}
      <div className="mt-0.5">
        <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: PRIORITY_COLORS[task.priority] }} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-100">{task.title}</h3>
        {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
          <CategoryChip category={task.category} />
          {task.estimated_mins && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {task.estimated_mins >= 60 ? `${Math.floor(task.estimated_mins / 60)}h` : `${task.estimated_mins}m`}
            </span>
          )}
        </div>
      </div>
      {/* Start button */}
      <button
        onClick={onStart}
        className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-gray-200 hover:bg-white/5 transition-colors shrink-0"
      >
        Start now
      </button>
    </div>
  );
}

export function FocusView() {
  const { tasks, updateTask } = useTaskStore();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done' && t.status !== 'archived'),
    [tasks]
  );

  const dueTodayTasks = useMemo(
    () => tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'done' && t.status !== 'archived'),
    [tasks]
  );

  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed_at && isToday(parseISO(t.completed_at))),
    [tasks]
  );

  const handleStart = async (id: string) => {
    await updateTask(id, { status: 'in_progress' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <span className="text-lg font-bold"><span className="text-indigo-400">Task</span><span className="text-white">Forge</span></span>
        <span className="text-sm text-gray-400">{format(now, 'EEEE, d MMMM yyyy')}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Greeting */}
          <h1 className="text-3xl font-bold text-gray-100">{greeting}, Deepak</h1>
          <p className="text-gray-400 mt-1">
            You have {overdueTasks.length + dueTodayTasks.length} tasks to focus on today
            {overdueTasks.length > 0 && `, ${overdueTasks.length} are overdue`}.
          </p>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-[#1e1e35] border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Overdue</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{overdueTasks.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#1e1e35] border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Due today</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{dueTodayTasks.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#1e1e35] border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Completed today</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{completedToday.length}</p>
            </div>
          </div>

          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overdue</h2>
                <span className="text-xs text-gray-500">{overdueTasks.length} tasks</span>
              </div>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <FocusTaskCard key={task.id} task={task} onStart={() => handleStart(task.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Due today section */}
          {dueTodayTasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Due today</h2>
                <span className="text-xs text-gray-500">{dueTodayTasks.length} tasks</span>
              </div>
              <div className="space-y-3">
                {dueTodayTasks.map((task) => (
                  <FocusTaskCard key={task.id} task={task} onStart={() => handleStart(task.id)} />
                ))}
              </div>
            </div>
          )}

          {overdueTasks.length === 0 && dueTodayTasks.length === 0 && (
            <div className="mt-12 text-center text-gray-500">
              <p className="text-lg">All clear for today!</p>
              <p className="text-sm mt-1">No overdue or due tasks. Great work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
