import React from 'react';
import { useViewStore } from '@/stores/view-store';
import { useTaskStore } from '@/stores/task-store';
import { PriorityBadge } from './PriorityBadge';
import { DueDateChip } from './DueDateChip';
import { CategoryChip } from './CategoryChip';
import { STATUS_LABELS, PRIORITY_LABELS } from '@shared/constants';
import { format } from 'date-fns';

export function TaskDetailPanel() {
  const { isTaskDetailOpen, selectedTaskId, closeTaskDetail, openTaskForm } = useViewStore();
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const task = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  if (!isTaskDetailOpen || !task) return null;

  const handleDelete = async () => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      await deleteTask(task.id);
      closeTaskDetail();
    }
  };

  const handleStatusChange = async (status: string) => {
    await updateTask(task.id, { status: status as any });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={closeTaskDetail} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-[340px] surface border-l border-white/[0.06] flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 pb-2">
          <h2 className="text-[16px] font-medium text-zinc-200 leading-snug flex-1">
            {task.title}
          </h2>
          <div className="flex gap-1 flex-shrink-0">
            <IconButton
              onClick={() => { closeTaskDetail(); openTaskForm(task.id); }}
              title="Edit"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </IconButton>
            <IconButton onClick={handleDelete} title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </IconButton>
            <IconButton onClick={closeTaskDetail} title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </IconButton>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap px-4 pb-3">
          <Badge className="bg-amber-500/10 text-amber-300">{STATUS_LABELS[task.status]}</Badge>
          <Badge className={
            task.priority === 3 ? 'bg-red-500/10 text-red-300' :
            task.priority === 2 ? 'bg-amber-500/10 text-amber-300' :
            task.priority === 1 ? 'bg-blue-500/10 text-blue-300' :
            'bg-zinc-500/10 text-zinc-400'
          }>{PRIORITY_LABELS[task.priority]} priority</Badge>
          {task.category && <Badge className="bg-indigo-500/10 text-indigo-300">{task.category}</Badge>}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Due date */}
          {task.due_date && (
            <Section label="Due date">
              <div className="flex items-center gap-2">
                <DueDateChip dueDate={task.due_date} dueTime={task.due_time} showIcon />
                {task.due_time && (
                  <span className="text-[13px] text-zinc-300">at {task.due_time}</span>
                )}
              </div>
            </Section>
          )}

          {/* Description */}
          {task.description && (
            <Section label="Description">
              <p className="text-[13px] text-zinc-300/80 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </Section>
          )}

          {/* Estimated time */}
          {task.estimated_mins && (
            <Section label="Estimated time">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span className="text-[13px] text-zinc-300">
                  {task.estimated_mins >= 60
                    ? `${Math.floor(task.estimated_mins / 60)} hour${Math.floor(task.estimated_mins / 60) > 1 ? 's' : ''}${task.estimated_mins % 60 ? ` ${task.estimated_mins % 60} mins` : ''}`
                    : `${task.estimated_mins} mins`}
                </span>
              </div>
            </Section>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <Section label="Tags">
              <div className="flex gap-1 flex-wrap">
                {task.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded text-[11px] bg-white/5 text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Schedule */}
          {task.scheduled_date && (
            <Section label="Scheduled">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-zinc-300">
                  {format(new Date(task.scheduled_date), 'EEE d MMM')}
                </span>
                {task.scheduled_slot && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-300 capitalize">
                    {task.scheduled_slot}
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* Source */}
          <Section label="Source">
            <span className="text-[13px] text-zinc-500 capitalize">{task.source_connector || 'manual'} entry</span>
          </Section>

          {/* Timestamps */}
          <Section label="">
            <div className="text-[11px] text-zinc-600 leading-relaxed">
              Created: {format(new Date(task.created_at), 'd MMM yyyy, HH:mm')}<br />
              Updated: {format(new Date(task.updated_at), 'd MMM yyyy, HH:mm')}
              {task.completed_at && (
                <><br />Completed: {format(new Date(task.completed_at), 'd MMM yyyy, HH:mm')}</>
              )}
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex gap-1.5 p-3 border-t border-white/[0.06]">
          {task.status !== 'in_progress' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="flex-1 py-2 rounded-lg text-[12px] font-medium text-center bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
            >
              Mark in progress
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => handleStatusChange('done')}
              className="flex-1 py-2 rounded-lg text-[12px] font-medium text-center bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 transition-colors"
            >
              Mark done
            </button>
          )}
          {task.status === 'done' && (
            <button
              onClick={() => handleStatusChange('todo')}
              className="flex-1 py-2 rounded-lg text-[12px] font-medium text-center surface-elevated border border-white/[0.06] text-zinc-400 hover:bg-white/5 transition-colors"
            >
              Reopen task
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-white/[0.04]">
      {label && <div className="text-[11px] font-medium text-zinc-500 mb-1.5">{label}</div>}
      {children}
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`text-[11px] px-2.5 py-0.5 rounded-md ${className}`}>{children}</span>;
}

function IconButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 border border-white/[0.06] hover:bg-white/5 hover:text-zinc-400 transition-colors"
    >
      {children}
    </button>
  );
}
