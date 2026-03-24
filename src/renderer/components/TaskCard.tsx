import React, { useState } from 'react';
import type { Task } from '@shared/types';
import { PriorityBadge } from './PriorityBadge';
import { DueDateChip } from './DueDateChip';
import { CategoryChip } from './CategoryChip';
import { TaskContextMenu } from './TaskContextMenu';
import { useViewStore } from '@/stores/view-store';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityBorderMap = {
  3: 'border-l-red-500',
  2: 'border-l-amber-500',
  1: 'border-l-blue-500',
  0: 'border-l-zinc-600',
} as const;

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { openTaskDetail, openTaskForm } = useViewStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const isDone = task.status === 'done';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        className={`task-card surface rounded-lg p-2.5 px-3 border-l-[3px] cursor-pointer select-none ${
          priorityBorderMap[task.priority]
        } ${isDragging ? 'opacity-50 ring-2 ring-indigo-500/30' : ''} ${
          isDone ? 'opacity-50' : ''
        }`}
        onClick={() => openTaskDetail(task.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          openTaskForm(task.id);
        }}
        onContextMenu={handleContextMenu}
    >
      {/* Title row */}
      <div className="flex items-start gap-2 mb-1.5">
        <PriorityBadge priority={task.priority} variant="dot" />
        <span
          className={`text-[13px] font-medium leading-snug flex-1 ${
            isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
          }`}
        >
          {task.title}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-1.5 flex-wrap ml-4">
        <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
        <CategoryChip category={task.category} />
        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1 py-0.5 rounded text-[10px] bg-white/5 text-zinc-500"
          >
            {tag}
          </span>
        ))}
        {task.source_connector && task.source_connector !== 'manual' && (
          <span className="text-[10px] text-zinc-600" title={`Source: ${task.source_connector}`}>
            {task.source_connector === 'outlook' ? '📧' : '🔗'}
          </span>
        )}
      </div>

      {/* Estimated time (if set) */}
      {task.estimated_mins && (
        <div className="flex items-center gap-1 mt-1.5 ml-4">
          <svg className="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-[10px] text-zinc-600">
            {task.estimated_mins >= 60
              ? `${Math.floor(task.estimated_mins / 60)}h${task.estimated_mins % 60 ? ` ${task.estimated_mins % 60}m` : ''}`
              : `${task.estimated_mins}m`}
          </span>
        </div>
      )}
    </div>

    {/* Context menu */}
    {contextMenu && (
      <TaskContextMenu
        task={task}
        position={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    )}
  </>
  );
}
