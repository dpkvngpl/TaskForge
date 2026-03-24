import React, { useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { DueDateChip } from '@/components/DueDateChip';
import { CategoryChip } from '@/components/CategoryChip';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, isToday } from 'date-fns';
import type { Task } from '@shared/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function FocusTaskCard({
  task,
  onComplete,
  onClick,
  isCurrent,
}: {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  isCurrent?: boolean;
}) {
  return (
    <div
      className={`surface rounded-xl p-3.5 flex items-start gap-3.5 cursor-pointer transition-all border ${
        isCurrent ? 'border-indigo-500/30 bg-indigo-500/[0.04]' : 'border-white/[0.03] hover:border-white/[0.08]'
      }`}
      onClick={onClick}
    >
      {/* Priority checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className="w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 mt-0.5 hover:opacity-70 transition-opacity flex items-center justify-center"
        style={{ borderColor: PRIORITY_COLORS[task.priority] }}
      />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-zinc-200 leading-snug mb-1">{task.title}</div>
        {task.description && (
          <p className="text-[12px] text-zinc-500 leading-relaxed mb-2 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
          <CategoryChip category={task.category} />
          {task.estimated_mins && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {task.estimated_mins >= 60 ? `${Math.floor(task.estimated_mins / 60)}h` : `${task.estimated_mins}m`}
            </span>
          )}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="px-3.5 py-1.5 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[12px] hover:bg-indigo-500/25 transition-colors flex-shrink-0 mt-0.5"
      >
        Start now
      </button>
    </div>
  );
}

function CompletedRow({ task }: { task: Task }) {
  return (
    <div className="surface rounded-lg px-3.5 py-2.5 flex items-center gap-3 opacity-50">
      <div className="w-[18px] h-[18px] rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-[11px] h-[11px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <span className="text-[13px] text-zinc-500 line-through flex-1 truncate">{task.title}</span>
      {task.completed_at && (
        <span className="text-[11px] text-zinc-700 flex-shrink-0">
          {format(new Date(task.completed_at), 'h:mm a')}
        </span>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="surface-elevated rounded-lg px-3.5 py-3">
      <div className="text-[11px] text-zinc-500 mb-1">{label}</div>
      <div className={`text-[22px] font-medium ${color}`}>{value}</div>
    </div>
  );
}

function SectionHeader({ dot, label, count }: { dot: string; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-1">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
      <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">{count} tasks</span>
      )}
    </div>
  );
}

export function FocusView() {
  const { tasks, updateTask } = useTaskStore();
  const { openTaskDetail } = useViewStore();
  const today = new Date().toISOString().split('T')[0];

  const overdue = useMemo(
    () => tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done' && t.status !== 'archived')
      .sort((a, b) => b.priority - a.priority),
    [tasks, today]
  );

  const dueToday = useMemo(
    () => tasks.filter((t) => t.due_date === today && t.status !== 'done' && t.status !== 'archived')
      .sort((a, b) => b.priority - a.priority),
    [tasks, today]
  );

  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed_at && isToday(new Date(t.completed_at))),
    [tasks]
  );

  const totalFocus = overdue.length + dueToday.length;

  const handleComplete = async (taskId: string) => {
    await updateTask(taskId, { status: 'done' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[15px] font-medium text-zinc-200">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <span className="text-[14px] text-zinc-400 ml-auto">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-6 py-6">
          {/* Greeting */}
          <h1 className="text-[22px] font-medium text-zinc-200 mb-1">{getGreeting()}, Deepak</h1>
          <p className="text-[14px] text-zinc-500 mb-6">
            {totalFocus > 0
              ? `You have ${totalFocus} task${totalFocus !== 1 ? 's' : ''} to focus on today${overdue.length > 0 ? `, ${overdue.length} ${overdue.length === 1 ? 'is' : 'are'} overdue` : ''}.`
              : 'All clear — no tasks due today.'}
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Overdue" value={overdue.length} color="text-red-300" />
            <StatCard label="Due today" value={dueToday.length} color="text-amber-300" />
            <StatCard label="Completed today" value={completedToday.length} color="text-green-300" />
          </div>

          {/* Overdue section */}
          {overdue.length > 0 && (
            <div className="mb-6">
              <SectionHeader dot="#ef4444" label="Overdue" count={overdue.length} />
              <div className="space-y-2">
                {overdue.map((task, i) => (
                  <FocusTaskCard
                    key={task.id}
                    task={task}
                    isCurrent={i === 0}
                    onComplete={() => handleComplete(task.id)}
                    onClick={() => openTaskDetail(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due today section */}
          {dueToday.length > 0 && (
            <div className="mb-6">
              <SectionHeader dot="#f59e0b" label="Due today" count={dueToday.length} />
              <div className="space-y-2">
                {dueToday.map((task) => (
                  <FocusTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task.id)}
                    onClick={() => openTaskDetail(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Nothing due */}
          {overdue.length === 0 && dueToday.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
              </svg>
              <p className="text-[14px]">Nothing due today — enjoy the breathing room.</p>
            </div>
          )}

          {/* Completed today */}
          {completedToday.length > 0 && (
            <div className="mb-6">
              <SectionHeader dot="#22c55e" label="Completed today" />
              <div className="space-y-1.5">
                {completedToday.map((task) => (
                  <CompletedRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
